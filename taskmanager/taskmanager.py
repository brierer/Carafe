#!/usr/bin/env python
import subprocess
import simplejson as json
import redis
import pika
import time
import os
import urlparse
from collections import OrderedDict


class Message:

    def __init__(self, status=None, typeMsg=None, msg=None):
        self.status = status
        self.type = typeMsg
        self.msg = msg

    def to_json(self):
        return json.dumps({'statut': self.status,
                           'res': {'type': self.type, 'msg': self.msg}})


def errMessage(message):
    return errMessage(message).to_json()


class ErrMessage(Message):

    errors = {'invalidKey': 'Key cannot by null',
              'invalidFormulas': 'Formulas cannot be null',
              'clear': 'Problem with redis',
              'send': "The calculus wasn't not send",
              }

    def __init__(self, typeMsg):
        Message.__init__(self,
                         status="err",
                         typeMsg=typeMsg,
                         msg=self.errors[typeMsg])

    def errorMessage(typeMsg):
        ErrMessage(typeMsg).to_json()


def goodMessage(message):
    return GoodMessage(message).to_json()


class GoodMessage(Message):

    goods = {'send': 'The calculus is send',
             'set': 'Good setting keyword'
             }

    def __init__(self, typeMsg):
        Message.__init__(
            self, status="ok", typeMsg=typeMsg, msg=self.goods[typeMsg])

    def goodMessage(typeMsg):
        GoodMessage(typeMsg).to_json()


class Receiver:

    class __OnlyOne:

        def __init__(self):
            self.redis = redis.StrictRedis(host='localhost')
        #self.redis = redis.StrictRedis(host='pub-redis-14381.us-east-1-3.1.ec2.garantiadata.com', port=14381, db=0 , password="0UbTImi5I9qQ9ebQ" )

        def receive(self, name):
            return self.redis.get(name)

        def set(self, name, value):
            self.redis.set(name, value)

    instance = None

    def getLastMessageFrom(self, Id):
        if not Receiver.instance:
            Receiver.instance = Receiver.__OnlyOne()
        return Receiver.instance.receive(Id)

    def clear(self, id):
        if not Receiver.instance:
            Receiver.instance = Receiver.__OnlyOne()
        Receiver.instance.set(id, "")
        return goodMessage("set")

    def __init__(self):
        if not Receiver.instance:
            Receiver.instance = Receiver.__OnlyOne()


class Sender:

    class __OnlyOne:

        def __init__(self):
            url_str = os.environ.get(
                'tiger.cloudamqp.com',
                'amqp://vidvjemc:27f27zSadNC1KCEfEJoSrsSDP80Vbtrn@tiger.cloudamqp.com/vidvjemc')
            self.url = urlparse.urlparse(url_str)
            self.params = pika.ConnectionParameters(
                host='localhost', heartbeat_interval=5)
            self.connection = pika.BlockingConnection(parameters=self.params)
            self.channel = self.connection.channel()
            print '\033[1;32m[RMQ]  Ready\033[1;m'

        def reconnect(self):
            print '\033[1;32m[RMQ]  Reconnect\033[1;m'
            self.connection = pika.BlockingConnection(parameters=self.params)
            self.channel = self.connection.channel()

        def send(self, message, nb=0):
            try:
                self.channel.basic_publish(exchange='',
                                           routing_key='queue',
                                           body=message)
                return goodMessage("send")
            except Exception:
                if (nb < 5):
                    self.reconnect()
                    self.send(message, nb + 1)
            return errMessage("send")

    instance = None

    def sendMessage(self, message):
        if not Sender.instance:
            Sender.instance = Sender.__OnlyOne()
            if Sender.instance.is_close():
                Sender.instance.connect()
        return Sender.instance.send(message)

    def __init__(self):
        if not Sender.instance:
            Sender.instance = Sender.__OnlyOne()


class SendCalc:

    def __init__(self, key, formulas):
        self.key = key
        self.formulas = formulas

    def send(self):
        if self.key is None:
            return ErrMessage("invalidKey").to_json()
        if self.formulas is None:
            return ErrMessage("invalidFormulas").to_json()
        Receiver().clear(self.key)
        sender = Sender().sendMessage(self.key + ";" + self.formulas)
        return sender


class InitCalc(SendCalc):

    def __init__(self, seed, formulas):
        self.key = generate_task_key(seed)
        SendCalc.__init__(self, self.key, formulas)


def get_result(key):
    result = Receiver().getLastMessageFrom(key)
    if (result is None or result == ""):
        convertJSON = None
    else:
        convertJSON = json.loads(result, object_pairs_hook=OrderedDict)
    return convertJSON


def generate_task_key(seed):
    time_id = time.time()
    return seed + str(time_id)

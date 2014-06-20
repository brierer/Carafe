#!/usr/bin/env python
import subprocess
import simplejson as json
import redis
import pika
import time
import os
import urlparse
from collections import OrderedDict

class Receiver:
    class __OnlyOne:
        def __init__(self):
        	self.redis   = redis.StrictRedis(host='localhost' ) 
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
        else:
        	return Receiver.instance.receive(Id)	

    def clear(self, id):
        if not Receiver.instance:
            Receiver.instance = Receiver.__OnlyOne()
            Receiver.instance.set(id, "")
        else:
            Receiver.instance.set(id, "")    


    def __init__(self):
        if not Receiver.instance:
            Receiver.instance = Receiver.__OnlyOne()


class Sender:
    class __OnlyOne:
  
        def __init__(self):
            url_str = os.environ.get('tiger.cloudamqp.com', 'amqp://vidvjemc:27f27zSadNC1KCEfEJoSrsSDP80Vbtrn@tiger.cloudamqp.com/vidvjemc')
            print url_str
            url = urlparse.urlparse(url_str)
           #params = pika.ConnectionParameters(host="lean-fiver-20.bigwig.lshift.net", port = 11022, virtual_host="vndrShegf7N4",credentials=pika.PlainCredentials("5mPGLSH5", "-JSed3pUDdfCEUR9i-Bz1dXwZTtb7iGA"))
            params = pika.ConnectionParameters(host='localhost',heartbeat_interval = 0)
            connection = pika.BlockingConnection(parameters = params)
            self.channel = connection.channel()
            print '\033[1;32m[RMQ]  Ready\033[1;m'
    	def send(self, message):
		self.channel.basic_publish(exchange='',
		          routing_key='queue',
		          body=message)
      
    instance = None	
    def sendMessage(self, message):
        print message
    	if not Sender.instance:
            Sender.instance = Sender.__OnlyOne()
            if Sender.instance.is_close():
                Sender.instance.connect()    
            Sender.instance.send(message)
        else:
        	Sender.instance.send(message)	

    def __init__(self):
        if not Sender.instance:
            Sender.instance = Sender.__OnlyOne()
      

def initCalc(key, formulas):
    if key is None or formulas is None:
        return False
    print "Debut:"
    print int(round(time.time() * 1000))
    #print formulas
    Receiver().clear(key)
    sender = Sender().sendMessage(key+";"+formulas)
    print " [x] Sent " + key
    return True 

def getResult(key, id):
    print int(round(time.time() * 1000))
    print " [x] Get  " + key
    result = Receiver().getLastMessageFrom(key)
    if (result is None or result == ""):
        return None 
    convertJSON = json.loads(result,object_pairs_hook=OrderedDict) 
    #print result
    print "Fin:"
    print int(round(time.time() * 1000))
    return convertJSON


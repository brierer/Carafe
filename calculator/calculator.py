#!/usr/bin/env python
import subprocess
import simplejson as json
import redis
import pika
import time


class Receiver:
    class __OnlyOne:
        def __init__(self):
        	self.redis   = redis.StrictRedis(host='localhost', port=6379, db=0)
       

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
        	connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
        	self.channel = connection.channel()
        	print '\033[1;32m[RMQ]  Ready\033[1;m'
    	def send(self, message):
		self.channel.basic_publish(exchange='',
		          routing_key='queue',
		          body=message)
	
		

    instance = None	
    def sendMessage(self, message):
    	if not Sender.instance:
        	Sender.instance = Sender.__OnlyOne()
        	Sender.instance.send(message)
        else:
        	Sender.instance.send(message)	

    def __init__(self):
        if not Sender.instance:
            Sender.instance = Sender.__OnlyOne()
      

def initCalc(key, formulas):
    Receiver().clear(key)
    sender = Sender().sendMessage(key+";"+formulas)
    print " [x] Sent " + key
    return None 

def getResult(key, id):
    print " [x] Get  " + key
    result = Receiver().getLastMessageFrom(key)
    if (result == ""):
        return None
    convertJSON = json.loads(result)   
    transposeJSON = map(transpose,table(convertJSON))
    return (transposeJSON,chart(convertJSON))


def transpose(array):
	return map(list,zip(*array))

def chart(array):
	return filter(lambda x: 'type' in x,array)
def table(array):
	return filter(lambda x:  'type' not in x  ,array 
		)

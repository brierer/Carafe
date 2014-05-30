from taskmanager import *
import threading

_local = threading.local()

def startSender():
    if 'sender' not in _local.__dict__:
       _local.sender = True
       Sender()


startSender()
Receiver()
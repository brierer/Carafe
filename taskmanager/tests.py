from django.test import TestCase
from taskmanager import *
import mock
import json


class TaskManagerTestCase(TestCase):

    def test_generate_task_key(self):
        with mock.patch('taskmanager.taskmanager.time.time') as Mock:
            Mock.return_value = "time"
            self.assertEquals(generate_task_key("seed"), "seedtime")

    def test_get_result(self):
        with mock.patch('taskmanager.taskmanager.Receiver.getLastMessageFrom') as Mock:
            res = '{"res": "res"}'
            Mock.return_value = res
            self.assertEquals(
                get_result("key"), json.loads(res,
                                              object_pairs_hook=OrderedDict))
            Mock.return_value = None
            self.assertEquals(get_result("key"), None)

    def test_Initial_Calc(self):
        i = InitCalc("seed", "formulas")
        self.assertEquals(i.key, generate_task_key("seed"))
        self.assertEquals(i.formulas, "formulas")

    @mock.patch('taskmanager.taskmanager.Receiver.clear')
    @mock.patch('taskmanager.taskmanager.Sender')
    def test_Send_Calc(self, mockSender, mockReceiver):
        s = SendCalc("key", "formulas")
        self.assertEquals(s.key, "key")
        self.assertEquals(s.formulas, "formulas")
        mockSender.sendMessage.return_value = True
        self.assertEquals(s.send(), mockSender().sendMessage())
        mockReceiver.assert_called_with('key')

        s = SendCalc(None, "formulas")
        self.assertEquals(s.send(), ErrMessage("invalidKey").to_json())

        s = SendCalc("key", None)
        self.assertEquals(s.send(), ErrMessage("invalidFormulas").to_json())

    def test_good_to_json(self):
        self.assertEquals(GoodMessage('send').to_json(),
                          json.dumps({'statut': 'ok', 'res':
                                      {'type': 'send',
                                       'msg': 'The calculus is send'}}))

    def test_err_to_json(self):
        self.assertEquals(ErrMessage("invalidKey").to_json(),
                          json.dumps({'statut': 'err', 'res':
                                      {'type': 'invalidKey',
                                       'msg': 'Key cannot by null'}}))

    @mock.patch('taskmanager.taskmanager.Sender._Sender__OnlyOne')
    def test_Sender(self, mockSender):
        Sender.instance = None
        self.assertFalse(Sender().instance is None)

    @mock.patch('taskmanager.taskmanager.Sender._Sender__OnlyOne')
    def test_Sender_sendMessage(self, mockSender):
        s = Sender()
        s.instance.send.return_value = goodMessage("send")
        self.assertEquals(s.sendMessage("send"), goodMessage("send"))

    @mock.patch('taskmanager.taskmanager.Receiver._Receiver__OnlyOne')
    def test_Receiver_sendMessage(self, mockReceiver):
        Receiver.instance = None
        r = Receiver()
        r.instance.set.return_value = goodMessage("set")
        self.assertEquals(r.clear("send"), goodMessage("set"))

    @mock.patch('taskmanager.taskmanager.Receiver._Receiver__OnlyOne')
    def test_Receiver(self, mockReceiver):
        Receiver.instance = None
        Receiver()
        self.assertEquals(Receiver.instance, mockReceiver())

    @mock.patch('taskmanager.taskmanager.Receiver._Receiver__OnlyOne')
    def test_Receiver(self, mockReceiver):
        Receiver.instance = None
        r = Receiver()
        r.instance.receive.return_value = True
        self.assertEquals(r.getLastMessageFrom(1), True)

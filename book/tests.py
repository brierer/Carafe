from django.test import TestCase
from models import Book


class BookViewsTestCase(TestCase):
    def setUp(self):
        book1 = Book.objects.create(user_id=1)
        book2 = Book(user_id=1,equations="x=sum(2,2)",private=False, title="test")
        book1.save()
        self.books = [book1,book2]


    def test_get_calc(self):
        resp = self.client.get('/book/1',{}, **{'HTTP_USER_AGENT':'firefox-22', 'REMOTE_ADDR':'127.0.0.1'})
        self.assertEqual(resp.context['read_only'], True)
        self.assertEqual(resp.context['book'].id, self.books[0].id)
        self.assertEqual(resp.context['equations'],self.books[0].equations)
        self.assertEqual(resp.context['result'],False)
        self.assertTrue(resp.context['key'] is not None) 
        self.assertTrue(resp.context['form'] is not None) 
        self.assertEqual(resp.status_code, 200)
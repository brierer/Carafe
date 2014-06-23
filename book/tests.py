from views import *
from django.test import TestCase
from models import Book
from forms import EquationsForm
from django.contrib.auth.models import User
from guardian.shortcuts import assign_perm


class BookViewsTestCase(TestCase):
    def setUp(self):
    	self.user = User.objects.create_user('john', 'lennon@thebeatles.com', 'johnpassword')
        book1 = Book.objects.create(user_id = self.user.id)
        book2 = Book(user_id = self.user.id, equations="x=sum(2,2)",private=False, title="test")
        self.books = [book1,book2]
        self.resp  = self.client.get('/book/'+`self.books[0].id`,{}, **{'HTTP_USER_AGENT':'firefox-22', 'REMOTE_ADDR':'127.0.0.1'})
    
    def test_work_book(self):
    	resp_post = self.client.post('/book/'+`self.books[0].id`,{})
    	self.assertEqual(resp_post.status_code, 405)
        assign_perm("work",self.user,self.books[0])
        self.assertEqual(self.resp.status_code, 200)
        self.assertEqual(self.resp.context['book'].id, self.books[0].id)
        self.assertEqual(self.resp.context['read_only'], True)
        self.assertTrue(self.resp.context['calc'] is not None) 
        self.assertTrue(type(self.resp.context['form']) is EquationsForm) 

    def test_get_book_or_404(self):
    	book = get_book_or_404(self.user,self.books[0].id)
    	self.assertEqual(book.id,self.books[0].id)
    	try:
    		get_book_or_404(self.user,0)
    		error = False
    	except Http404:
    		error = True
    	self.books[0].private = True	
    	try:
    		get_book_or_404(self.user,0)
    		error = False
    	except Http404:
    		error = True		
    	self.assertTrue(error)
    	

    def test_require_permission_book(self):
    	self.assertEqual(require_permission_book(self.user,self.books[0]),None)
    	self.books[0].private = True
    	try:
    		require_permission_book(self.user,self.books[0])
    		error = False
    	except Http404:
    		error = True
    	self.assertTrue(error)
    	assign_perm("work",self.user,self.books[0])
    	self.assertEqual(require_permission_book(self.user,self.books[0]),None)
    	




    			
from views import *
from django.test import TestCase
from models import Book
from django.contrib.auth.models import User
from guardian.shortcuts import assign_perm, remove_perm
import mock
import unittest


class BookModelsTestCase(TestCase):

    def test_has_perm(self):
        setUp(self)
        self.assertTrue(self.books[0].has_perm(self.user))
        remove_perm("work", self.user, self.books[0])
        self.assertTrue(self.books[0].has_perm(self.user))
        self.books[0].private = True
        self.assertFalse(self.books[0].has_perm(self.user))

    def test_book_readable(self):
        setUp(self)
        self.assertTrue(self.books[0].is_book_readable(self.user, True))
        self.assertFalse(self.books[0].is_book_readable(self.user, False))
        remove_perm("work", self.user, self.books[0])
        self.books[0].private = True
        self.assertTrue(self.books[0].is_book_readable(self.user, True))
        self.assertTrue(self.books[0].is_book_readable(self.user, False))

    def test_safe_update(self):
        setUp(self)
        eq = "x=(2)"
        kwargs = {'equations': eq}

        # Cannot update want read is ON
        self.books[0].safe_update(self.user, read=True, kwargs=kwargs)
        self.assertEqual(Book.objects.get(id=self.books[0].id).equations, None)

        # Can update we read OFF
        self.books[0].safe_update(self.user, read=False, kwargs=kwargs)
        self.assertEqual(Book.objects.get(id=self.books[0].id).equations, eq)

        # If remove perm we cannot update, even with read OFF
        self.books[0].safe_update(
            self.user, read=False, kwargs={'equations': None})
        remove_perm("work", self.user, self.books[0])

        self.books[0].safe_update(self.user, read=True, kwargs=kwargs)
        self.assertEqual(Book.objects.get(id=self.books[0].id).equations, None)

        self.books[0].safe_update(self.user, read=False, kwargs=kwargs)
        self.assertEqual(Book.objects.get(id=self.books[0].id).equations, None)


class BookViewsTestCase(TestCase):

    def test_work_book(self):
        setUp(self)
        resp_post = self.client.post(
            reverse("book.views.work_book",
                    kwargs={"book_id": self.books[0].id}), {})
        self.assertEqual(resp_post.status_code, 405)

        self.assertEqual(self.resp.status_code, 200)
        self.assertEqual(self.resp.context['book'], self.books[0])
        self.assertEqual(self.resp.context['read_only'], False)
        self.assertTrue(self.resp.context['calc'] is not None)
        self.assertTrue(type(self.resp.context['form']) is EquationsForm)

    def test_watch_book(self):
        setUp(self)
        resp_post = self.client.post(
            reverse("book.views.work_book",
                    kwargs={"book_id": self.books[0].id}), {})
        self.assertEqual(resp_post.status_code, 405)

        self.resp = self.client.get('/book/watch/' +`self.books[0].id`,
                                    **{'HTTP_USER_AGENT': 'firefox-22',
                                       'REMOTE_ADDR': '127.0.0.1'})
        self.assertEqual(self.resp.status_code, 200)
        self.assertEqual(self.resp.context['book'], self.books[0])
        self.assertEqual(self.resp.context['read_only'], True)
        self.assertTrue(self.resp.context['calc'] is not None)
        self.assertTrue(type(self.resp.context['form']) is EquationsForm)

    def test_create_book(self):
        setUp(self)
        # Ensure a post.
        resp = self.client.get(reverse('book.views.create_book'))
        self.assertEqual(resp.status_code, 405)

        # Send no POST data.
        resp = self.client.post(reverse('book.views.create_book'))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['form'][
                         'title'].errors, [u'This field is required.'])

        # Send junk POST data.
        resp = self.client.post(
            reverse('book.views.create_book'), {'foo': 'bar'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['form'][
                         'title'].errors, [u'This field is required.'])

        # Create new Book.
        resp = self.client.post(
            reverse('book.views.create_book'), {'title': 'bar'})
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(Book.objects.get(title='bar').title, 'bar')
        self.assertTrue(
            self.user.has_perm("work", Book.objects.get(title='bar')))

    def test_update_book(self):
        setUp(self)
        # Ensure a post.
        resp = self.client.get(
            reverse('update-book', kwargs={'pk': self.books[0].id}))
        self.assertEqual(resp.status_code, 405)

        # Send no POST data.
        resp = self.client.post(
            reverse('update-book', kwargs={'pk': self.books[0].id}))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['form'][
                         'title'].errors, [u'This field is required.'])

        # Send junk POST data.
        resp = self.client.post(
            reverse('update-book',
                    kwargs={'pk': self.books[0].id}), {'foo': 'bar'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.context['form'][
                         'title'].errors, [u'This field is required.'])

        # Create new Book.
        resp = self.client.post(
            reverse('update-book',
                    kwargs={'pk': self.books[0].id}), {'title': 'bar'})
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(Book.objects.get(id=self.books[0].id).title, 'bar')

    # ajax
    def test_post_calc(self):
        setUp(self)
        resp_get = self.client.get(
            reverse("book.views.post_calc"), {})
        self.assertEqual(
            (resp_get.content), json.dumps({u"result": u"error",
                                            u"message": u"Invalid Request"}))

        with mock.patch('book.views.EquationsForm') as MockClass:
            instance = MockClass.return_value
            instance.update_equations.return_value = {u"result": u"ok",
                                                      u"message": u""}
            resp_post = self.client.post(
                reverse("book.views.post_calc"), {})

            self.assertEqual(
                resp_post.content, json.dumps({u"result": u"ok",
                                               u"message": u""}))

    def test_get_calc(self):
        setUp(self)
        resp_post = self.client.post(
            reverse("book.views.get_calc"), {})
        self.assertEqual(
            resp_post.content, json.dumps({u"result": u"error",
                                          u"message": u"Invalid Request"}))

        with mock.patch('book.views.get_result') as Mock:
            Mock.return_value = {u"result": u"ok",
                                 u"message": u""}
            resp_get = self.client.get(
                reverse("book.views.get_calc"), {})

            self.assertEqual(
                resp_get.content, json.dumps({u"result": u"ok",
                                              u"message": u""}))

    # sub function
    def test_get_book_or_404(self):
        setUp(self)
        book = get_book_or_404(self.user, self.books[0].id)
        self.assertEqual(book.id, self.books[0].id)
        try:
            get_book_or_404(self.user, 0)
            error = False
        except Http404:
            error = True
        self.books[0].private = True
        try:
            get_book_or_404(self.user, 0)
            error = False
        except Http404:
            error = True
        self.assertTrue(error)

    def test_require_permission_book(self):
        setUp(self)
        remove_perm("work", self.user, self.books[0])
        self.assertEqual(
            require_permission_book(self.user, self.books[0]), None)
        self.books[0].private = True
        try:
            require_permission_book(self.user, self.books[0])
            error = False
        except Http404:
            error = True
        self.assertTrue(error)
        assign_perm("work", self.user, self.books[0])
        self.assertEqual(
            require_permission_book(self.user, self.books[0]), None)


def setUp(self):
    self.user = User.objects.create_user(
        'john', 'lennon@thebeatles.com', 'johnpassword')
    book1 = Book.objects.create(user_id=self.user.id, private=False)
    assign_perm("work", self.user, book1)
    self.books = [book1]
    self.client.login(username='john', password='johnpassword')
    self.resp = self.client.get(reverse("book.views.work_book",
                                        kwargs={"book_id": self.books[0].id}),
                                **{'HTTP_USER_AGENT': 'firefox-22',
                                   'REMOTE_ADDR': '127.0.0.1'})


class fakeSendCalc:

    def send(self):
        return true


def setUpForm(self):
    self.book = Book.objects.create(
        equations="", user_id=self.user.id, private=False)
    self.good_form = EquationsForm(
        {'form_id': "secret",
         'book_id': self.book.id,
         'equations': 'x=y\b\ny=2',
         'read_only': True})
    self.work_form = EquationsForm(
        {'form_id': "secret",
         'book_id': self.book.id,
         'equations': 'x=y\b\ny=2',
         'read_only': False})
    self.bad_form = EquationsForm()
    self.good_form.is_valid()


class BookFormsTestCase(unittest.TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            'john4', 'lennon@thebeatles.com', 'johnpassword')

    def tearDown(self):
        self.user.delete()

    def test_get_book(self):
        setUpForm(self)
        self.assertEqual(self.bad_form.get_book(self.user), None)
        self.assertEqual(self.good_form.get_book(self.user), self.book)

    def test_send_task(self):
        with mock.patch('book.forms.SendCalc', autospec=True) as MockClass:
            instance = MockClass.return_value
            instance.send.return_value = True
            setUpForm(self)
            self.assertTrue(self.good_form.send_task())

    def test_update_equations(self):
        with mock.patch('book.forms.SendCalc', autospec=True) as MockClass:
            instance = MockClass.return_value
            instance.send.return_value = True
            setUpForm(self)

            # Test if update calcul without saving formulas
            self.assertEqual(self.good_form.update_equations(
                self.user), {'result': 'ok', 'message': True})
            self.assertEquals(
                Book.objects.get(id=self.book.id).equations, "")

            # Test if update without saving because no right
            self.assertEqual(self.work_form.update_equations(
                self.user), {'result': 'ok', 'message': True})
            self.assertEquals(
                Book.objects.get(id=self.book.id).equations, "")

            # Assign Right and retest update
            assign_perm("work", self.user, self.book)
            self.assertEqual(self.work_form.update_equations(
                self.user), {'result': 'ok', 'message': True})
            self.assertEquals(
                Book.objects.get(id=self.book.id).equations,
                self.work_form.cleaned_data["equations"])

            # Test invalid form
            self.assertEqual(self.bad_form.update_equations(self.user), {
                             'message': 'Invalid Form', 'result': 'error'})

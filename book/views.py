#-*- coding: utf-8 -*-
from django.shortcuts import render
from django.core.urlresolvers import reverse
from book.forms import EquationsForm, BookForm, CreateBookForm
from book.models import Book
from taskmanager.taskmanager import InitCalc, get_result
from django.shortcuts import redirect
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.views.generic import UpdateView
from django.views.decorators.http import require_GET, require_POST
from guardian.shortcuts import assign_perm
import json
import requests


def getUserCountry(ip):
    try:
        url = "https://freegeoip.net/json/" + ip
        r = requests.get(url)
        return r.json()['city']
    except Exception:
        return "Montreal"


def require_mtl(fn):
    def fonction_modifiee(*args, **kargs):
        ip = get_client_ip(args[0])
        city = getUserCountry(ip)
        if ip == "127.0.0.1" or city == u'Montréal':
            return fn(*args, **kargs)
        else:
            raise Http404
    return fonction_modifiee
# Url Function


@require_mtl
@require_GET
def work_book(request, book_id):
    return render(request,
                  'book/workspace.html',
                  get_book(request,
                           book_id,
                           request.GET.get('read', '') == 'true'))


@require_mtl
@require_GET
def watch_book(request, book_id):
    return render(request, 'book/watch.html',
                  get_book(request, book_id, True))


@require_mtl
@require_POST
def create_book(request):
    form = CreateBookForm(request.POST)
    if form.is_valid():
        title = form.cleaned_data['title']
        book = Book(title=title, user_id=request.user.id)
        book.save()
        assign_perm("work", request.user, book)
        return redirect(reverse("book.views.work_book",
                                kwargs={"book_id": book.id}))
    else:
        errors = form.errors
        return render(request, 'profil/page.html', locals())


class UpdateBook(UpdateView):
    model = Book
    form_class = BookForm
    template_name = 'book/update.html'
    success_url = '/profil/'
    http_method_names = [u'post']

    def get_context_data(self, **kwargs):
        context = super(UpdateBook, self).get_context_data(**kwargs)
        context['action'] = reverse('update-book',
                                    kwargs={'pk': self.get_object().id})
        return context


# AJAX
def post_calc(request):
    if request.method == 'POST':
        form = EquationsForm(request.POST)
        res = form.update_equations(request.user)
    else:
        res = {u'result': u'error', u'message': u'Invalid Request'}
    return HttpResponse(json.dumps(res), content_type="application/json")


def get_calc(request):
    if request.method == 'GET':
        form_id = request.GET.get('form_id', 'default')
        res = get_result(form_id)
    else:
        res = {u'result': u'error', u'message': u'Invalid Request'}
    return HttpResponse(json.dumps(res), content_type="application/json")

# subFunction


def get_book(request, book_id, read):
    book = get_book_or_404(request.user, book_id)
    calc = InitCalc(get_client_ip(request), book.equations)
    calc.send()
    read_only = book.is_book_readable(request.user, read)
    form = EquationsForm({'equations': book.equations,
                          'read_only': read_only,
                          'form_id': calc.key,
                          'book_id': book.id})
    return locals()


def get_book_or_404(user, book_id):
    book = get_object_or_404(Book, pk=book_id)
    require_permission_book(user, book)
    return book


def require_permission_book(user, book):
    if book.user_has_not_perm(user):
        raise Http404


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_REAL_IP')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

#-*- coding: utf-8 -*-
from django.core.context_processors import csrf
from django.shortcuts import render
from django.core.urlresolvers import reverse
from book.forms import * 
from book.models import Book
from taskmanager.taskmanager import *
from django.shortcuts import redirect
from django.http import HttpResponse
from enum import Enum
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import permission_required
from django.views.generic import UpdateView
from django.http import Http404  
from django.views.decorators.http import require_GET, require_POST
import json
import time



def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def validate_send_calc(form, request):
	if form.is_valid():
			equations = form.cleaned_data['equations']
			form_id = form.cleaned_data['form_id']
			book_id = form.cleaned_data['book_id']
			read_only = form.cleaned_data['read_only']
			book = Book.objects.get(id=book_id)
			if not request.user.has_perm("book.work",book) and book.private:
				print "private"
				valid = False
			else:	
				print "go calc"
				equations = filter(lambda a: ord(a) != 13 , equations)
				resultat = SendCalc(form_id, equations)
				if not read_only:
					book.equations =	equations
					book.save()
				valid = True
	else:
		print form.errors
		print "invalid" 
		valid = False
	return valid				
	

def post_calc_result(request):
	if request.method == 'POST':  
		form = EquationsForm(request.POST) 
		validate_send_calc(form, request)
		return HttpResponse(json.dumps(None), content_type="application/json")
	else:
		response_data = {}
		response_data['result'] = 'failed'
		response_data['message'] = 'You messed up'
		return HttpResponse(json.dumps(response_data), content_type="application/json")	

@require_GET
def get_calc_result(request):
	form_id = request.GET.get('form_id', 'default')
	key = form_id 
	resultat = getResult(key ,1)	
	return HttpResponse(json.dumps(resultat), content_type="application/json")


def get_book(request, book_id, read):
	book = get_book_or_404(request.user, book_id)
	calc = InitCalc(get_client_ip(request), book.equations)
	read_only = book.is_book_readable(request.user, read)
	form = EquationsForm({'equations':book.equations,
						  'read_only':read_only,
						  'form_id':calc.key,
						  'book_id':book.id})				    
	return locals()  

@require_GET
def work_book(request, book_id):				    
	return render(request, 
				  'book/workspace.html', 
				  get_book(request, 
				  		   book_id, 
				  		   request.GET.get('read', '')=='true'))  


@require_GET
def watch_book(request,book_id):
	return render(request, 'book/watch.html',  get_book(request, book_id, True)) 


def create_book(request):
	if request.method == 'POST': 
		form = CreateBookForm(request.POST)  
		if form.is_valid():
			title = form.cleaned_data['title']
			book = Book(title=title, user_id = request.user.id)
			book.save()
			book_id = book.id
			return render(request, 'book/workspace.html', locals())
	return redirect('/profil/')		

 
class UpdateBook(UpdateView):
    model = Book
    form_class = BookForm
    template_name = 'book/update.html'
    success_url = '/profil/'

    def get_context_data(self, **kwargs):
        context = super(UpdateBook, self).get_context_data(**kwargs)
        context['action'] = reverse('update-book',
                                    kwargs={'pk': self.get_object().id})
        return context    


def get_book_or_404(user, book_id):
	book = get_object_or_404(Book, pk=book_id)
	require_permission_book(user, book)
	return book

def require_permission_book(user, book):
	if not book.has_perm(user) and book.private:
			raise Http404 
		

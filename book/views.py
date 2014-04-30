#-*- coding: utf-8 -*-
from django.core.context_processors import csrf
from django.shortcuts import render
from book.forms import * 
from book.models import Book, get_book_by_Id
from taskmanager.taskmanager import *
from django.shortcuts import redirect
from django.http import HttpResponse
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
			formulas = form.cleaned_data['formulas']
			form_id = form.cleaned_data['form_id']
			book_id = form.cleaned_data['book_id']
			formulas = filter(lambda a: ord(a) != 13 , formulas)
			key = generate_calc_key(request,form_id)
			resultat = initCalc(key, formulas)
			book = Book.objects.get(id=book_id)
			book.formulas =	formulas
			book.save()
			return True
	else: 
			return False		
	
def generate_calc_key(request, time_id):
	return get_client_ip(request) + str(time_id)

def post_calc_result(request):
	if request.method == 'POST':  
		form = FormulasForm(request.POST) 
		validate_send_calc(form, request)
		return HttpResponse(json.dumps(None), content_type="application/json")
	else:
		response_data = {}
		response_data['result'] = 'failed'
		response_data['message'] = 'You messed up'
		return HttpResponse(json.dumps(response_data), content_type="application/json")	

def get_calc_result(request):
	form_id = request.GET.get('form_id', 'default')
	key = get_client_ip(request) + form_id
	if request.method == 'GET':  
		resultat = getResult(key ,1)	
		return HttpResponse(json.dumps(resultat), content_type="application/json")

def get_book(request, book_id):
	book = get_book_by_Id(book_id)
	formulas =	book.formulas	
	time_calc = time.time()
	key = generate_calc_key(request,time_calc) 
	resultat = initCalc(key, formulas)
	form = FormulasForm()  #
	form.setKey(book_id, time_calc)
	return render(request, 'book/workspace.html', locals())  

def watch_book(request,book_id):
	book = get_book_by_Id(book_id)
	formulas =	book.formulas	
	time_calc = time.time()
	key = generate_calc_key(request,time_calc) 
	resultat = initCalc(key, formulas)
	form = FormulasForm()  #
	form.setKey(book_id, time_calc)
	return render(request, 'book/watch.html', locals()) 

def create_book(request):
	print request.method
	if request.method == 'POST': 
		form = CreateBookForm(request.POST)  
		if form.is_valid():
			title = form.cleaned_data['title']
			book = Book(title=title, user_id = request.user.id)
			book.save()
			book_id = book.id
			return render(request, 'book/workspace.html', locals())
	return redirect('/profil/account/')		

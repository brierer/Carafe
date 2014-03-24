#-*- coding: utf-8 -*-
from django.core.context_processors import csrf
from django.shortcuts import render
from book.forms import * 
from book.models import Book, getBookById
from calculator.calculator import *
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

def get_calc_result(request):
	form_id = request.GET.get('form_id', 'default')
	key = get_client_ip(request) + form_id
	if request.method == 'GET':  # S'il s'agit d'une requête POST
		resultat = getResult(key ,1)	
		return HttpResponse(json.dumps(resultat), content_type="application/json")


def post_calc_result(request):
	if request.method == 'POST':  # S'il s'agit d'une requête POST
		form = FormulasForm(request.POST)  # Nous reprenons les données
		if form.is_valid():
			formulas = form.cleaned_data['formulas']
			form_id = form.cleaned_data['form_id']
			book_id = form.cleaned_data['book_id']
			formulas = filter(lambda a: ord(a) != 13 , formulas)
			key = get_client_ip(request + form_id
			resultat = initCalc(key, formulas)
			if (resultat is not None):
				result = resultat[0]
				chart = resultat[1]
			book = Book.objects.get(id=book_id)# a modifier
			book.formulas =	formulas
			book.save()
		return HttpResponse(json.dumps(resultat), content_type="application/json")
	else:
		response_data = {}
		response_data['result'] = 'failed'
		response_data['message'] = 'You messed up'
		return HttpResponse(json.dumps(response_data), content_type="application/json")	

def create_book(request):
	print request.method
	if request.method == 'POST':  # S'il s'agit d'une requête POST
		form = CreateBookForm(request.POST)  # Nous reprenons les données
		if form.is_valid():
			title = form.cleaned_data['title']
			book = Book(title=title, user_id = request.user.id)
			book.save()
			book_id = book.id
			return render(request, 'book/workspace.html', locals())
	return redirect('/profil/account/')		


def get_book(request, book_id):
	book = getBookById(book_id)
	formulas =	book.formulas	
	form = FormulasForm()  # Nous créons un formulaire vide
	form.setKey(book_id)
	return render(request, 'book/workspace.html', locals())  

def evaluate_formulas(request, book_id): 
	return get_book(request, book_id) 
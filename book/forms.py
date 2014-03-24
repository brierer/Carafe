#-*- coding: utf-8 -*-
from django import forms
from django.core.signing import Signer
import time

class FormulasForm(forms.Form):
	form_id = forms.CharField(widget=forms.HiddenInput())
	book_id = forms.CharField(widget=forms.HiddenInput())
	formulas = forms.CharField(widget=forms.Textarea)

	def __init__(self, *args, **kwargs):
		super(FormulasForm, self).__init__(*args, **kwargs)

	def setKey(self, book_id):
		self.fields['book_id'] = forms.CharField(widget=forms.HiddenInput(), initial=book_id)
		self.fields['form_id'] = forms.CharField(widget=forms.HiddenInput(), initial=time.time())
			
		
class CreateBookForm(forms.Form):
	title = forms.CharField(max_length=100)   

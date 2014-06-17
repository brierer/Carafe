#-*- coding: utf-8 -*-
from django import forms
from django.core.signing import Signer
from models import Book

class BookForm(forms.ModelForm):
    class Meta:
        model = Book
        fields = ('title',) 

class FormulasForm(forms.Form):
	form_id = forms.CharField(widget=forms.HiddenInput())
	book_id = forms.CharField(widget=forms.HiddenInput())
	formulas = forms.CharField(widget=forms.Textarea)
	read_only = forms.BooleanField(widget=forms.HiddenInput(),required=False)

	def __init__(self, *args, **kwargs):
		super(FormulasForm, self).__init__(*args, **kwargs)
	
	def setForm(self, formulas, book_id, time_id, read_only):
		self.fields['formulas'] = forms.CharField(widget=forms.HiddenInput(), initial=formulas)
		self.fields['book_id'] = forms.CharField(widget=forms.HiddenInput(), initial=book_id)
		self.fields['form_id'] = forms.CharField(widget=forms.HiddenInput(), initial=time_id)
		self.fields['read_only'] = forms.BooleanField(widget=forms.HiddenInput(), initial=read_only)	
		
class CreateBookForm(forms.Form):
	title = forms.CharField(max_length=100)   



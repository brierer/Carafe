#-*- coding: utf-8 -*-
from django import forms
from models import Book
from taskmanager.taskmanager import SendCalc


class BookForm(forms.ModelForm):

    class Meta:
        model = Book
        fields = ('title',)


class EquationsForm(forms.Form):
    form_id = forms.CharField(widget=forms.HiddenInput())
    book_id = forms.CharField(widget=forms.HiddenInput())
    equations = forms.CharField(widget=forms.Textarea)
    read_only = forms.BooleanField(widget=forms.HiddenInput(), required=False)

    def __init__(self, *args, **kwargs):
        super(EquationsForm, self).__init__(*args, **kwargs)

    def setForm(self, equations, book_id, time_id, read_only):
        self.fields['equations'] = forms.CharField(
            widget=forms.HiddenInput(), initial=equations)
        self.fields['book_id'] = forms.CharField(
            widget=forms.HiddenInput(), initial=book_id)
        self.fields['form_id'] = forms.CharField(
            widget=forms.HiddenInput(), initial=time_id)
        self.fields['read_only'] = forms.BooleanField(
            widget=forms.HiddenInput(), initial=read_only)

    def save(self, user):
        read_only = self.cleaned_data['read_only']
        equations = filter(
            lambda a: ord(a) != 13, self.cleaned_data['equations'])
        self.book.safe_update(user, read_only, {'equations': equations})

    def get_book(self, user):
        if self.is_valid():
            self.book = Book.objects.get_book_with_user_perm(
                user, self.cleaned_data['book_id'])
            return self.book
        else:
            return None

    def send_task(self):
        equations = self.cleaned_data['equations']
        equations = filter(lambda a: ord(a) != 13, equations)
        form_id = self.cleaned_data['form_id']
        return SendCalc(form_id, equations).send()

    def update_equations(self, user):
        book = self.get_book(user)
        if book is not None:
            self.save(user)
            res = self.send_task()
            return {'result': 'ok', 'message': res}
        else:
            return {'result': 'error', 'message': 'Invalid Form'}


class CreateBookForm(forms.Form):
    title = forms.CharField(max_length=100)

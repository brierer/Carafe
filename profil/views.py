from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import *
from book.models import Book
from book.forms import *
from django.contrib.auth import logout  
from django.core.urlresolvers import reverse    
from django.http import Http404  

@login_required()
def get_user_page(request):
    user = request.user
    books = Book.objects.filter(user_id = request.user.id)
    createBookForm = CreateBookForm()
    read_profil = False
    return render(request, 'profil/page.html', locals()) 


def watch_user_page(request, user_email):
    user = request.user
    if (user.username==user_email):
        return get_user_page(request)
    else:   
        try:
            other_user =  User.objects.get(username=user_email)
        except User.DoesNotExist:
            raise Http404
        books = Book.objects.filter(user_id = other_user.id, private=False)
        read_profil = True
        return render(request, 'profil/page.html', locals()) 

def user_logout(request):                                                                            
    logout(request)                                                                                     
    return redirect(reverse("home.views.home"))
from django.contrib.auth.decorators import login_required
from django.shortcuts import *
from book.models import Book
from book.forms import *
from django.contrib.auth import logout  
from django.core.urlresolvers import reverse    


@login_required()
def user_account(request):
	user = request.user
	books = Book.objects.filter(user_id = request.user.id)
	createBookForm = CreateBookForm()
	return render(request, 'profil/account.html', locals()) 

def user_logout(request):                                                                            
    logout(request)                                                                                     
    return redirect(reverse("blog.views.home"))
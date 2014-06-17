#-*- coding: utf-8 -*-
from django.http import HttpResponse, Http404
from django.shortcuts import render
from django.contrib.auth.views import login
from django.contrib.auth import authenticate
from profil.models import Profil
from profil.forms import ConnexionForm
from django.shortcuts import redirect

def home(request):
    error = False
    if request.user.is_authenticated():
  	 	return redirect('/profil/')
    if request.method == "POST":
        form = ConnexionForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data["username"]  # Nous récupérons le nom d'utilisateur
            password = form.cleaned_data["password"]  # … et le mot de passe
            user = authenticate(username=username, password=password)  #Nous vérifions si les données sont correctes
            if user:  # Si l'objet renvoyé n'est pas None
                login(request, user)  # nous connectons l'utilisateur
                errorAuthenticate = False
                return redirect('/profil/')
            else: #sinon une erreur sera affichée
            	errorAuthenticate = True
                return render(request, 'home/login.html', locals()) 
        else:
        	return render(request, 'home/login.html', locals())      
    else:
        form = ConnexionForm()

    return render(request, 'home/home.html', locals())

def log(request):
    return render(request, 'home/login.html', locals()) 

def deconnexion(request):                                                                               
     logout(request)                                                                                     
     return redirect('',locals())     
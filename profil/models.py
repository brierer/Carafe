#-*- coding: utf-8 -*-
from django.contrib.auth.models import User
from django.db import models

class Profil(models.Model):
    user = models.OneToOneField(User)  # La liaison OneToOne vers le modèle User

    def __unicode__(self):
        return u"Profil de {0}".format(self.user.username)
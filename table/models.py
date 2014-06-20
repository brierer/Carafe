from django.db import models
from django_hstore import hstore
from book.models import Book
import datetime

# Create your models here.
class Table(models.Model):
    title = models.CharField(max_length=100)
    created_date = models.DateTimeField(default=datetime.datetime.now)
    data = hstore.DictionaryField(db_index=True, default="")
    objects = hstore.HStoreManager()
    book = models.ForeignKey(Book)
    
from django.db import models
from django.contrib.auth.models import User
import datetime
from Crypto.Cipher import AES
import base64

MASTER_KEY="Some-long-base-key-to-use-as-encyrption-key"

def encrypt_val(clear_text):
	enc_secret = AES.new(MASTER_KEY[:32])
	tag_string = (str(clear_text) +
		(AES.block_size -
			len(str(clear_text)) % AES.block_size) * "\0")
	cipher_text = base64.urlsafe_b64encode(enc_secret.encrypt(tag_string))

	return cipher_text

def decrypt_val(cipher_text):
    dec_secret = AES.new(MASTER_KEY[:32])
    raw_decrypted = dec_secret.decrypt(base64.urlsafe_b64decode(cipher_text))
    clear_val = raw_decrypted.rstrip("\0")
    return clear_val

def getBookById(crypt_id):
	return Book.objects.get(id=crypt_id)


# Create your models here.
class Book(models.Model):
	title = models.CharField(max_length=100)
	formulas = models.TextField(null=True)
	created_date = models.DateTimeField(default=datetime.datetime.now)
	user = models.ForeignKey(User)

	@property
	def link(self):
		return self.id

	def __unicode__(self):
		return self.title

	
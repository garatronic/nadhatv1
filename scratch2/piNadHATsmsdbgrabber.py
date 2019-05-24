# The MIT License (MIT)
# Copyright (c) 2019 Garatronic S.A.S
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files 
# (the "Software"), to deal in the Software without restriction, 
# including without limitation the rights to use, copy, modify, merge,
# publish, distribute, sublicense, and/or sell copies of the Software,
# and to permit persons to whom the Software is furnished to do so, 
# subject to the following conditions:
#
# The above copyright notice and this permission notice shall be 
# included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
# NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import sys
import mysql.connector
import time


cnx = mysql.connector.connect(user='root', password='nadbian', host='127.0.0.1', database='smsd')
cursor = cnx.cursor()

if sys.argv[1] == "SMS_LAST":

	previous_sms_id = 0
	sms_id = 0
	sms_date = ""
	sms_text = ""
	sms_transmitter = ""
	
	# 1ere requette MySQL
	query = ("SELECT ID, ReceivingDateTime, TextDecoded, SenderNumber FROM inbox ORDER BY ID DESC "
			 "LIMIT 1")
	cursor.execute(query)

	for ( ID ) in cursor:
		previous_sms_id= int(ID[0])
		
	# 2eme requete MySQL en boucle
	while 1:
		query = ("SELECT ID, ReceivingDateTime, TextDecoded, SenderNumber FROM inbox ORDER BY ID DESC "
				 "LIMIT 1")
		cursor.execute(query)
	
		for ( ID, ReceivingDateTime, TextDecoded, SenderNumber ) in cursor:
			sms_id = int(ID)
			sms_date = ReceivingDateTime
			sms_text = TextDecoded
			sms_transmitter = SenderNumber
		
		if sms_id > previous_sms_id:
			break
		time.sleep(1)

	# Sortie sur STDOUT
	print("SMS_IN_ID:{}\nSMS_IN_DATE:{}\nSMS_IN_TRANSMITTER:{}\nSMS_IN_TEXT:{}".format(
			sms_id, sms_date, sms_transmitter, sms_text.encode('utf-8')))
	
	
elif sys.argv[1] == "PHONELIST":
	
	# Requette MySQL
	query = ("SELECT SenderNumber FROM inbox")
	cursor.execute(query)

	# Creation du carnet
	phonebook={"empty"}
	for (SenderNumber) in cursor:
		phonebook.add(SenderNumber[0])
	phonebook.remove("empty")

	# Creation/Ecrasement du fichier ~/.nadhat.phonelist
	f = open("/home/pi/.phonelist", "w")
	for lines in phonebook:
		f.write("{}\n".format(lines))
		print("{}".format(lines))
	f.close()

else:
	
	print("piNadHATsmsdbgrabber.py [SMS_LAST|PHONELIST] [SMS_ID]\n")

# Fermeture connexion MYSQL
cursor.close()
cnx.close()

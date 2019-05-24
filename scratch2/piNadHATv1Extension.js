// The MIT License (MIT)
// Copyright (c) 2019 Garatronic S.A.S
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files 
// (the "Software"), to deal in the Software without restriction, 
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so, 
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be 
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

new (function() {

	var extension = this;
	var global_error = false;


    var SMS_OUT_DATE;
    var SMS_OUT_TEXT;
    var SMS_OUT_RECEIVER;


    var SMS_IN_ID = 0;
    var SMS_IN_TEXT;
    var SMS_IN_TRANSMITTER;
    var SMS_IN_DATE;


    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['w', 'When i receive a SMS', 'Waiting_SMS'],
            [' ', 'Send %s by SMS to %m.phonelist', 'Send_SMS', ' ', 'recipient number'],
            [' ', 'Send %s by SMS to %s', 'Send_SMS', ' ', ' '],
            ['r', 'Received SMS: Date', 'Get_SMS_IN_DATE'],
            ['r', 'Received SMS: Phone', 'Get_SMS_IN_TRANSMITTER'],
            ['r', 'Received SMS: String(Text)', 'Get_SMS_IN_STEXT'],
            ['r', 'Received SMS: Number(Text)', 'Get_SMS_IN_NTEXT'],
            ['r', '%s %m.condition1 %s  %m.condition2  %s %m.condition1 %s', 'Check_Conditions', ' ', 'contains', ' ', 'OR', ' ', 'contains', ' ' ],
            ['r', '%s %m.condition1 %s', 'Check_Conditions', ' ', 'contains', ' ', 'OR', '0', 'equal to', '1' ],
            ['r', 'Sent SMS: Date', 'Get_SMS_OUT_DATE'],
            ['r', 'Sent SMS: Phone', 'Get_SMS_OUT_RECEIVER'],
            ['r', 'Sent SMS: Text', 'Get_SMS_OUT_TEXT']
        ],
        menus: {
			phonelist: [],
			condition1: ['contains', 'not contains', 'superior to', 'inferior to', 'superior or equal to', 'inferior or equal to', 'equal to' , 'different of'],
			condition2: ['OR', 'AND', 'NOT OR', 'NOT AND', 'EXCLUSIVE OR' ],
		},
        url: 'http://www.garatronic.fr',
		displayName: 'Pi NadHAT v1 GSM/GPRS extension board'
    };

	var execFile = require('child_process').execFile;
	var options = { encoding: 'utf8',
					timeout: 0,
					maxBuffer: 1024,
					killSignal: 'SIGTERM' };

	extension.Update_Phonebook = function (callback)
	{

		var command = execFile('python', ['/usr/lib/scratch2/scratch_extensions/piNadHATsmsdbgrabber.py', 'PHONELIST'], options);
		result='';
		command.stdout.on('data', function(data)
		{
			result += data.toString();
		});

		command.on('close', function(code)
		{
			array = result.split("\n");
			for(i=0;array[i];i++)
			{
				descriptor.menus.phonelist.push(array[i]);
			}
			ScratchExtensions.register('Pi NadHAT', descriptor, extension);
			callback(array);
		});
    };


    // Cleanup function when the extension is unloaded
    extension._shutdown = function ()
    {
    };

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    extension._getStatus = function ()
    {
		if ( global_error == false ) return {status: 2, msg: 'Ready'};
    };

	// Check_Conditions
	extension.Check_Conditions = function (value1a, condition1, value1b, operator, value2a, condition2, value2b)
	{
		var res1 = false, res2 = false;

		switch(condition1)
		{
			case 'contains':
				if ( value1a.lastIndexOf(value1b) != -1) res1 = true;
				break;
			case 'not contains':
				if ( value1a.lastIndexOf(value1b) == -1) res1 = true;
				break;
			case 'superior to':
				if ( value1a > value1b ) res1 = true;
				break;
			case 'inferior to':
				if ( value1a < value1b ) res1 = true;
				break;
			case 'superior or equal to':
				if ( value1a >= value1b ) res1 = true;
				break;
			case 'inferior or equal to':
				if ( value1a <= value1b ) res1 = true;
				break;
			case 'equal to':
				if ( value1a == value1b ) res1 = true;
				break;
			case 'different of':
				if ( value1a != value1b ) res1 = true;
				break;
		}

		switch(condition2)
		{
			case 'contains':
				if ( value2a.lastIndexOf(value2b) != -1) res2 = true;
				break;
			case 'not contains':
				if ( value2a.lastIndexOf(value2b) == -1) res2 = true;
				break;
			case 'superior to':
				if ( value2a > value2b ) res2 = true;
				break;
			case 'inferior to':
				if ( value2a < value2b ) res2 = true;
				break;
			case 'superior or equal to':
				if ( value2a >= value2b ) res2 = true;
				break;
			case 'inferior or equal to':
				if ( value2a <= value2b ) res2 = true;
				break;
			case 'equal to':
				if ( value2a == value2b ) res2 = true;
				break;
			case 'different of':
				if ( value2a != value2b ) res2 = true;
				break;
		}

		switch(operator)
		{
			case 'OR':
				return ( res1 || res2 );
				break;
			case 'AND':
				return ( res1 && res2 );
				break;
			case 'NOT OR':
				return (!( res1 || res2 ));
				break;
			case 'NOT AND':
				return (!( res1 && res2 ));
				break;
			case 'EXCLUSIVE OR':
				return ( res1 != res2 );
				break;
		}
	};


    // Send_SMS
    extension.Send_SMS = function (payload, phone)
    {
		if (phone == 'choice') return false;

		var date = new Date();
		const { execFile } = require('child_process');

		const child = execFile('gammu-smsd-inject', ['TEXT', String(phone), '-text', String (payload)], (error, stdout, stderr) =>
		{
			if (error)
			{
				global_error = true;
				return false;
			}
			SMS_OUT_DATE = Date (date.getUTCDate())
			SMS_OUT_TEXT = String (payload);
			SMS_OUT_RECEIVER = String(phone);
			return true;
		});
	};

    // Waiting_SMS
    extension.Waiting_SMS = function (callback)
    {
		var command = execFile('python', ['/usr/lib/scratch2/scratch_extensions/piNadHATsmsdbgrabber.py', 'SMS_LAST'], options);
		result='';
		command.stdout.on('data', function(data)
		{
			result += data.toString();
		});

		command.on('close', function(code)
		{
			array = result.split("\n");
			for(i=0;i<=3;i++)
			{
				textline = array[i].split(":");
				switch(textline[0])
				{
					case 'SMS_IN_ID':
						SMS_IN_ID = Number(textline[1]);
						break;
					case 'SMS_IN_DATE':
						SMS_IN_DATE = String(textline[1])+':'+String(textline[2])+':'+String(textline[3]);
						break;
					case 'SMS_IN_TRANSMITTER':
						SMS_IN_TRANSMITTER = String(textline[1]);
						break;
					case 'SMS_IN_TEXT':
						SMS_IN_TEXT = String(textline[1]);
						break;
					default:
						break;
				}
			}

			while ((array[i] != "") && (i < 10))
			{
				SMS_IN_TEXT += "\n"
				SMS_IN_TEXT += array[i];
				i++;
			}

			callback(SMS_IN_ID);
		});
    };


	// Get_SMS_OUT_DATE
	extension.Get_SMS_OUT_DATE = function ()
	{
		return String(SMS_OUT_DATE);
	};

	// Get_SMS_OUT_TEXT
	extension.Get_SMS_OUT_TEXT = function ()
	{
		return String(SMS_OUT_TEXT);
	};

	// Get_SMS_OUT_RECEIVER
	extension.Get_SMS_OUT_RECEIVER = function ()
	{
		return String(SMS_OUT_RECEIVER);
	};

	// Get_SMS_IN_STEXT
	extension.Get_SMS_IN_STEXT = function ()
	{
		return String(SMS_IN_TEXT);
	};

	// Get_SMS_IN_NTEXT
	extension.Get_SMS_IN_NTEXT = function ()
	{
		var i; text_number='', dot=true;
		for(i=0;SMS_IN_TEXT[i];i++)
		{
			switch (SMS_IN_TEXT[i])
			{
				case '0' :
				case '1' :
				case '2' :
				case '3' :
				case '4' :
				case '5' :
				case '6' :
				case '7' :
				case '8' :
				case '9' :
					text_number += SMS_IN_TEXT[i];
					break;
				case '.' :
				case ',' :
					if (dot) text_number += '.';
					dot=false;
					break;
				default:
					break;
			}
		}
		return Number(text_number);
	};

	// Get_SMS_IN_TRANSMITTER
	extension.Get_SMS_IN_TRANSMITTER = function ()
	{
		return String(SMS_IN_TRANSMITTER);
	};

	// Get_SMS_IN_DATE
	extension.Get_SMS_IN_DATE = function ()
	{
		return String(SMS_IN_DATE);
	};

	// debug string
	extension.Debug = function ()
	{
		return String(debug);
	};

	//
	extension.Update_Phonebook(descriptor);


})();

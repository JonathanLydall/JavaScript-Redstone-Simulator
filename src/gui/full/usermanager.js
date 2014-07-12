/*
 * JavaScript Redstone Simulator
 * Copyright (C) 2012  Jonathan Lydall (Email: jonathan.lydall@gmail.com)
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA. 
 * 
 */

com.mordritch.mcSim.guiFull_userManager = function(gui) {
	this.gui = gui;
	this.L10n = gui.L10n;
	this.schematicListingLoaded = false;
	this.authenticated = false;
	this.signInFirst = false; //Called by any feature which requires the user to be signed, for example saving a schematic on the server
	
	/**
	 * Shortcut function call to this.gui.localization.getString();
	 */
	this.l = function(string) {
		return this.gui.localization.getString(string);
	};
	
	this.construct = function() {
		var t = this;
		$('body').append(
			'<div id="userManager_dropDown">' +
				'<div id="userManager_dropDown_loggedIn_true" class="userManagerDropdown"></div>' +
				//'<div id="userManager_dropDown_loggedIn_false" class="userManagerDropdown"><form action="" method="post"></div>' +
			'</div>'
		);

		$('#userManagerHolder').append(
			'<span id="userManagerDropdownButton" class="userManager hand">Log in / Create Account &#9660;</span>'
		);
		
		$('#userManager_dropDown_loggedIn_true, #userManager_dropDown').hide();
		
		//Below bindings handle showing/hiding of our dropdown:
		$('#userManagerDropdownButton').bind('click', {t: this}, function(e) {e.data.t.clickDropdown();});
		$('#userManager_dropDown').bind('mouseenter', {t: this}, function(e) {e.data.t.mouseEntered = true;});
		$('#userManager_dropDown').bind('mouseleave', {t: this}, function(e) {e.data.t.mouseEntered = false;});
		$(window).bind('click', {t: this}, function(e) {
			if (e.data.t.mouseEntered == false && e.target.id != 'userManagerDropdownButton') {
				$('#userManager_dropDown').hide();
			}
		});
		
		/*
		this.modal_newAccount = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_newAccount.bind('show', function() {t.onModalShow_newAccount()});
		this.modal_newAccount.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_newAccount.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_newAccount.jqDomId + ' form').submit();
		});
		*/
		
		this.modal_signIn = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_signIn.bind('show', function() {t.onModalShow_signIn();});
		this.modal_signIn.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_signIn.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_signIn.jqDomId + ' form').submit();
		});
		

		this.modal_forgotPassword = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_forgotPassword.bind('show', function() {t.onModalShow_forgotPassword();});
		this.modal_forgotPassword.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_forgotPassword.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_forgotPassword.jqDomId + ' form').submit();
		});

		this.modal_changePassword = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_changePassword.bind('show', function() {t.onModalShow_changePassword();});
		this.modal_changePassword.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_changePassword.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_changePassword.jqDomId + ' form').submit();
		});

		this.modal_editProfile = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_editProfile.bind('show', function() {t.onModalShow_editProfile();});
		this.modal_editProfile.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_editProfile.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_editProfile.jqDomId + ' form').submit();
		});
		
		this.modal_schematicListing = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_schematicListing.bind('show', function() {t.onModalShow_schematicListing();});
		this.modal_schematicListing.addButton({
			label: this.L10n.getString('usermanager.form.refresh'),
			onActivateFunction: function() {t.onModalShow_schematicListing();}
		});
		
		if (
			!userManager_cookieCheckResponse.error &&
			userManager_cookieCheckResponse.authenticated
		) {
			this.loggedIn(userManager_cookieCheckResponse.userData);
		}
	};

		/*
	
		this.ownSchematicListing = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.ownSchematicListing.html(
			'<div><button class="loadButton">Refresh List</button></div>' +
			'<div class="loading"><img src="images/loading1.gif" alt="Loading..."/><span> Loading...</span></div>' +
			'<div class="schematicList"></div>' +
			''
		);
		
		var t = this;
		$('#' + t.domId + '_dropdown .listOwnSchematics').bind('click', {'t': this}, function(e) {
			e.data.t.ownSchematicListing.show();
			if (!t.ownSchematicListing_loaded) {
				t.ownSchematicListing_loaded = true;
				$('#' + t.ownSchematicListing.domId + ' .loadButton').click();
			}
		});

		$('#' + t.ownSchematicListing.domId + ' .loadButton').bind('click', {'t': this}, function(e) {
			$('#' + t.ownSchematicListing.domId + ' .loadButton').hide();
			$('#' + t.ownSchematicListing.domId + ' .loading').show();
			$('#' + t.ownSchematicListing.domId + ' .schematicList').hide();

			$.getJSON('php/userManager.php?task=get_schematicListForLoggedInUser', function(data) {
				t.schematicLoadingComplete(data);
			});
		});
		*/

	this.bindForm = function(modal, task) {
		var t = this;
		$(modal.jqDomId + ' form').ajaxForm({
			url: 'php/userManager.php?task='+task,
			type: 'post',
			dataType: 'json',
			beforeSubmit: function() {
				t.formBeforeSubmit(modal);
			},
			success: function(data) {
				t.formSuccess(modal, data);
			}
		});

		$(modal.jqDomId + ' input').keyup(function(e) {
			if(e.keyCode == 13) $(modal.jqDomId + ' form').submit();
		});
	};
	
	this.formBeforeSubmit = function(modal) {
		modal.startWaitingForServer(this.l("usermanager.form.contactingserver"));
		$(modal.jqDomId + ' .formError').html('<br/>');
		$(modal.jqDomId + ' .applyButton').addClass('disabled');
	};

	this.formSuccess = function(modal, data) {
		modal.stopWaitingForServer();
		if (!data.error) {
			modal.hide();
			this.loggedIn(data.userData);
			if (this.signInFirst) {
				this.signInFirst = false;
				this.signInFirst_callback();
			}
		}
		else {
			var jqDomId = modal.jqDomId  + ' .'; 
			modal.setFeedbackText('<span class="errorText">' + this.l("usermanager.form.inputerror") + '</span>');
			for (var i in data.errorMessages) {
				//console.log("error: %s (%s)", i, data.errorMessages[i]);
				$(jqDomId + i).html('<br/>'+data.errorMessages[i]);
			}
		}
	};
	
	/**
	 *A single form which prompts for user to log on with an existing account or make a new account 
	 */
	this.onModalShow_signIn = function() {
		var t = this;
		var content = 
			'<form>' +
				'<span id="signInFirst"></span>' +
				'<input type="hidden" id="signIn_task" name="task" value="existing">' +
				'<div id="signIn_existing" class="signIn signIn_selected">' +
					'<b>' + this.l("usermanager.title.existinguser") + '</b>' +
	
					'<p>'+this.l('usermanager.passwordreset.email')+'<br/>' +
					'<input type="text" name="existing_emailAddress" /></p>' +
					//'<input type="text" name="existing_emailAddress" value="jonathan.lydall@gmail.com" /></p>' + //TODO: temp, to make on login test easy
		
					'<p>'+this.l('usermanager.profile.password')+'<br/>' +
					'<input type="password" name="existing_password" />' +
					//'<input type="password" name="existing_password" value="password"/>' + //TODO: Temp, to make on login test easy
					'<br/><a href="#" id="iForgotMyPassword">'+this.l('usermanager.passwordforgottenlink')+'</a></p>' + 
					'<span class="formError existing_general"></span>' +
				'</div>' +
				'<div id="signIn_new" class="signIn signIn_unselected">' +
						'<b>' + this.l("usermanager.title.newuser") + '</b>' +

					'<p>'+this.l('usermanager.profile.email')+'<br/>' +
						'<input type="text" name="new_emailAddress" />' +
						'<span class="formError new_emailAddress"><br/></span></p>' +
					
					'<p>'+this.l('usermanager.profile.displayname')+'</br>' +
						'<input type="text" name="new_displayName"/>' +
						'<span class="formError new_displayName"></span></p>' +
					
					'<p>'+this.l('usermanager.profile.password')+'<br/>' +
						'<input type="password" name="new_password" />' +
						'<span class="formError new_password"><br/></span></p>' +
					
					'<p>'+this.l('usermanager.profile.confirmpassword')+'</br>' +
						'<input type="password" name="new_confirmPassword" />' +
						'<span class="formError new_confirmPassword"></span></p>' +
					
					'<p>'+this.l('usermanager.newaccount.privacynotice')+'</p>' +
				'</div>' +
				'<div id="signIn_forgottenPassword" class="signIn signIn_unselected">' +
					'<b>' + this.l("usermanager.title.forgottenpassword") + '</b>' +
					'<p>'+this.l('usermanager.passwordreset.email')+'<br/>' +
						'<input type="text" name="forgottenPassword_emailAddress" id="forgottenPassword_emailAddress_input" />' +
						'<span class="formError forgottenPassword_emailAddress"><br/></span></p>' +
					'<span class="formError forgottenPassword_general"></span>' +
				'</div>' +
			'</form>';
		this.modal_signIn.setContent(content);
		this.modal_signIn.setFeedbackText('');

		
		$('#signIn_new').bind('click', function () {t.signIn_select("new");});
		$('#signIn_new input').bind('focus', function () {t.signIn_select("new");});
		
		$('#signIn_existing').bind('click', function () {t.signIn_select("existing");});
		$('#signIn_existing input').bind('focus', function () {t.signIn_select("existing");});

		$('#signIn_forgottenPassword').bind('click', function () {t.signIn_select("forgottenPassword");});
		//$('#signIn_forgottenPassword input').bind('focus', function () {t.signIn_select("forgottenPassword");});
		$('#iForgotMyPassword').bind('click', function() {
			setTimeout(function() {
				t.signIn_select('forgottenPassword');
			},0);
			
		});
		$('#signIn_forgottenPassword').hide();

		this.bindForm(this.modal_signIn, 'process_signIn');
	};
	
	this.signIn_select = function(type) {
		$('#signIn_new').removeClass('signIn_selected');
		$('#signIn_new').addClass('signIn_unselected');
		$('#signIn_existing').removeClass('signIn_selected');
		$('#signIn_existing').addClass('signIn_unselected');
		$('#signIn_forgottenPassword').removeClass('signIn_selected');
		$('#signIn_forgottenPassword').addClass('signIn_unselected');
		$('#signIn_forgottenPassword').hide();
		

		$('#signIn_' + type).removeClass('signIn_unselected');
		$('#signIn_' + type).addClass('signIn_selected');
		//console.log('#signIn_' + type);
		
		if (type == "forgottenPassword") {
			$('#signIn_forgottenPassword').show();
			$('#forgottenPassword_emailAddress_input').focus();
		}
		
		$('#signIn_task').val(type);
		return false;
	};
	
	/**
	 * Called by any feature which requires the user to sign in first, for example if they want to save their schematic on the server
	 * @param	{String}	Text which appears at the top of the window explaining to the user that they need to sign in first.
	 * @param	{Function}	Callback function for if the sign in / sign up is successfull. Not called if the window is cancelled / closed.
	 *  
	 */
	this.show_signInFirst = function(text, callback) {
		this.signInFirst = true;
		this.signInFirst_callback = callback;
		this.modal_signIn.show();
		$('#signInFirst').html(this.l(text) + '</br>');
	};
	
	/*
	this.onModalShow_newAccount = function() {
		var content =
			'<form>' +
				'<p>'+this.l('usermanager.profile.email')+'<br/>' +
					'<input type="text" name="emailAddress" />' +
					'<span class="formError emailAddress"><br/></span></p>' +
				'<p>'+this.l('usermanager.profile.password')+'<br/>' +
					'<input type="password" name="password" />' +
					'<span class="formError password"><br/></span></p>' +
				'<p>'+this.l('usermanager.profile.confirmpassword')+'</br>' +
					'<input type="password" name="confirmPassword" />' +
					'<span class="formError confirmPassword"></span></p>' +
				'<p>'+this.l('usermanager.profile.displayname')+'</br>' +
					'<input type="text" name="displayName"/>' +
					'<span class="formError displayName"></span></p>' +
			'</form>';
		this.modal_newAccount.setContent(content);
		this.bindForm(this.modal_newAccount, 'process_newAccount');
	}
	*/
	
	this.onModalShow_forgotPassword = function() {
		var content =
			'<form>' +
				'<p>'+this.l('usermanager.passwordreset.email')+'<br/>' +
					'<input type="text" name="emailAddress" />' +
					'<span class="formError emailAddress"></span>' +
				'</p>' +
			'</form>';
		this.modal_forgotPassword.setContent(content);
		this.bindForm(this.modal_forgotPassword, 'process_resetPassword');
	};

	this.onModalShow_editProfile = function() {
		var content =
			'<form>' +
				'<p>'+this.l('usermanager.profile.email')+'<br/>' +
					'<input type="text" name="emailAddress" value="'+this.userData.emailAddress+'"/>' +
					'<span class="formError emailAddress"></span>' +
				'</p>' +
				'<p>'+this.l('usermanager.profile.displayname')+'</br>' +
					'<input type="text" name="displayName" value="'+this.userData.displayName+'"/>' +
					'<span class="formError displayName"></span>' +
				'</p>' +
				'<div class="formError general"></div>' +
			'</form>';
		this.modal_editProfile.setContent(content);
		this.bindForm(this.modal_editProfile, 'process_editProfile');
	};

	this.onModalShow_changePassword = function() {
		var content =
			'<form>' +
				'<p>'+this.l('usermanager.editpassword.currentpassword')+'<br/>' +
					'<input type="password" name="oldPassword" />' +
					'<span class="formError oldPassword"><br/></span></p>' +
				'<p>'+this.l('usermanager.profile.password')+'<br/>' +
					'<input type="password" name="password" />' +
					'<span class="formError password"><br/></span></p>' +
				'<p>'+this.l('usermanager.profile.confirmpassword')+'</br>' +
					'<input type="password" name="confirmPassword" />' +
					'<span class="formError confirmPassword"></span></p>' +
			'</form>';
		this.modal_changePassword.setContent(content);
		this.bindForm(this.modal_changePassword, 'process_editPassword');
	};
	
	this.showDropDown = function() {
		var t = this;
		if (typeof this.userData == 'undefined') {
			var email = '';
		}
		else {
			var email = this.userData.emailAddress;
		}
		
		$('#userManager_dropDown_loggedIn_true').html( 
			'<span class="userMail hand" style="font-weight: bold;">'+email+'</span></br>' +
			'<span class="listOwnSchematics hand">'+this.l('usermanager.dropdown.listownschematics')+'</span></br>' +
			'<span class="editProfile hand">'+this.l('usermanager.dropdown.editprofile')+'</span></br>' +
			'<span class="editPassword hand">'+this.l('usermanager.dropdown.changepassword')+'</span></br>' +
			'<span class="logOut hand">'+this.l('usermanager.dropdown.logout')+'</span></br>' +
		'');
		
		$('#userManager_dropDown_loggedIn_true .editProfile').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_editProfile.show();
		});
		$('#userManager_dropDown_loggedIn_true .editPassword').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_changePassword.show();
		});
		$('#userManager_dropDown_loggedIn_true .listOwnSchematics').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_schematicListing.show();
		});
		$('#userManager_dropDown_loggedIn_true .logOut').bind('click', {'t': this}, function(e) {
			e.data.t.logOut();
		});
		
		/*
		$('#userManager_dropDown_loggedIn_false form').html(
			'<span>'+this.l('usermanager.passwordreset.email')+'</span><br/>' +
			//'<input type="text" name="emailAddress" /><br/>' +
			'<input type="text" name="emailAddress" value="jonathan.lydall@gmail.com" /><br/>' + //TODO: temp, to make on login test easy

			'<span>'+this.l('usermanager.profile.password')+'</span><br/>' +
			//'<input type="password" name="password" /><br/>' +
			'<input type="password" name="password" value="password"/><br/>' + //TODO: Temp, to make on login test easy
			
			'<div class="formError logInError"></div>' +
			'<span class="newAccount hand">'+this.l('usermanager.dropdown.createaccount')+'</span><br/>' +
			'<span class="resetPassword hand">'+this.l('usermanager.dropdown.resetpassword')+'</span><br/>' +
			'<button class="logIn">'+this.l('usermanager.dropdown.login')+'</button><!--img class="loadingIcon" src="images/loading1.gif" alt="Loading..."/--><br/>'
		);
		
		$('#userManager_dropDown_loggedIn_false form').ajaxForm({
			url: 'php/userManager.php?task=process_logIn',
			iframe: true,
			type: 'post',
			dataType: 'json',
			beforeSubmit: function() {
				//$('#' + t.domId + '_dropdown .loadingIcon').show();
				$('#userManager_dropDown_loggedIn_false form .logIn').attr('disabled', true); //TODO: Uncomment for LIVE
				$('#userManager_dropDown_loggedIn_false form .logInError').hide();
			},
			success: function(data) {t.processLogin(data);}
		});
		
		
		$('#userManager_dropDown_loggedIn_false .newAccount').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_newAccount.show();
		});
		$('#userManager_dropDown_loggedIn_false .resetPassword').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_forgotPassword.show();
		});
		*/
		
		$('#userManager_dropDown').show();
	};
	
	this.clickDropdown = function() {
		if ($('#userManager_dropDown').css('display') == 'none') {
			this.mouseEntered = false;
			if (this.authenticated == false) {
				this.modal_signIn.show();
			}
			else {
				this.showDropDown();
			}
		}
		else {
			$('#userManager_dropDown').hide();
		}
	};

	this.onModalShow_schematicListing = function() {
		this.modal_schematicListing.setContent("");
		this.modal_schematicListing.startWaitingForServer(this.L10n.getString('usermanager.form.waitingforserver'));
		
		var t = this;
		if (!this.schematicListingLoaded) {
			$.ajax({
				type: 'GET',
				url: 'php/userManager.php?task=get_schematicListForLoggedInUser',
				dataType: 'json',
				success: function(data) {
					t.modal_schematicListing.stopWaitingForServer();
					t.schematicLoadingComplete(data);
				}
			});
		}
	};
	
	this.schematicLoadingComplete = function(data) {
		if (data.error) {
			console.error('Server responded with an error: %s', data.errorMessage);
		}
		else {
			var html = 
				'<table class="schematicListing">' +
					'<tr>' +
						'<th>ID:</th>' +
						//'<th>File Name:</th>' +
						'<th>Title:</th>' +
						//'<th style="width: 10px;">Description:</th>' +
						//'<th>File Size:</th>' +
						//'<th>Created:</th>' +
						'<th>Last Modified:</th>' +
					'</tr>' +
				'';
			
			for (var row in data.schematicList) {
				var id = data.schematicList[row].id;
				var href = this.gui.urlHistory.generateUrl(id);

				html +=
					'<tr>' +
						'<td><a data-id="' + id + '" href="' + href + '">' + id + '</a></td>' +
						//'<td>' + data.schematicList[row].filename + '</td>' +
						'<td>' + data.schematicList[row].title + '</td>' +
						//'<td>' + data.schematicList[row].description + '</td>' +
						//'<td>' + data.schematicList[row].fileSize + '</td>' +
						//'<td>' + data.schematicList[row].firstCreated + '</td>' +
						'<td>' + data.schematicList[row].lastModified + '</td>' +
					'</tr>' +
				'';
			}
			
			html += '</table>';
			this.modal_schematicListing.setContent(html);
		}

		$('.schematicListing a').on('click', {t: this}, function(event) {
			if (event.which == 1) {
				var t = event.data.t;
				t.modal_schematicListing.hide();
				t.gui.urlHistory.onUrlClick(event);
			}
		});
	};
	
	this.logOut = function() {
		$('#userManager_dropDown').hide();
		$('#userManager_dropDown_loggedIn_true').hide();
		$('#userManagerDropdownButton').html('<img src="images/loading1.gif" alt=""> ' + this.l('usermanager.loggingout'));

		var t = this;
		$.getJSON('php/userManager.php?task=process_logOut', function(data) {
			if (data.error) {
				console.error("Server responded with error: " + data.errorMessage);
				return;
			}

			t.loggedOut();
		});
	};
	
	this.loggedOut = function() {
		this.authenticated = false;
		$('#userManagerDropdownButton').html(this.l('usermanager.notloggedin')+'&#9660;');
	};
	
	this.loggedIn = function(userData) {
		this.authenticated = true;
		
		this.userData = {
			userId: userData.userId,
			displayName: userData.displayName,
			emailAddress: userData.emailAddress
		};
		
		if (
			userData.userSettings != null &&
			typeof userData.userSettings.guiFull != 'undefined'
		) {
			this.gui.userSettings = userData.userSettings.guiFull;
			this.gui.userSettingsLoaded();
		}
		
		$('#userManagerDropdownButton').html(this.gui.localization.getString('usermanager.loggedin', this.userData.displayName) + ' &#9660;');

		$('#userManager_dropDown').hide();
		$('#userManager_dropDown_loggedIn_true').show();
	};
	
	/**
	 * Saves all settings to the user's profile on the webserver, if they are logged in. 
	 */
	this.saveUserSettings = function() {
		if (this.authenticated) {
			var JSON_data = JSON.stringify(this.gui.userSettings);
			
			$.ajax({
				type: 'POST',
				url: 'php/userManager.php?task=process_commitUserSettings&type=guiFull',
				data: {'data': JSON_data},
				success: function(data) {
					//TODO: Give feedback to the user
					if (data.error) {
						console.log('Saving options to server failed, server responded with: ' + data.errorMessage);	
					}
					else {
						console.log('Succesfully saved options.');
					}
				},
				dataType: 'json'
			});
		}
	};
	

	/*
	this.processLogin = function(data) {
		//$('#userManager_dropDown_loggedIn_false .loadingIcon').hide();
		$('#userManager_dropDown_loggedIn_false .logIn').attr('disabled', false);
		if (data.error) {
			$('#userManager_dropDown_loggedIn_false .logInError').text(data.errorMessages.general);
			$('#userManager_dropDown_loggedIn_false .logInError').show();
		}
		else {
			this.loggedIn(data.userData);
		}
	}
	
	this.processResult = function(data) {
		$('#' + this.userManagerModal.domId + ' .loadingIcon').hide();
		$('#' + this.userManagerModal.domId + ' .submitButton').attr('disabled', false);
		
		if (!data.error) {
			alert(data.successMessage);
			this.userManagerModal.hide();
			if (typeof data.userData != 'undefined') {
				this.loggedIn(data.userData);
			}
		}
		else {
			$('#' + this.userManagerModal.domId + ' .formError').hide(); //Hide all
			for (var field in data.errorMessages) {
				//unhide one by one as needed
				$('#' + this.userManagerModal.domId + ' .' + field).html('<br/>' + data.errorMessages[field]);
				$('#' + this.userManagerModal.domId + ' .' + field).show();
			}
		}
	}
	*/
	
	this.construct();
};

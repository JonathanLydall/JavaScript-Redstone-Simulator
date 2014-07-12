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

com.mordritch.mcSim.submitFeedback = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var modal = new com.mordritch.mcSim.guiFullModal(gui);
	
	var construct = function() {
		modal.addButton({
			label: L10n.getString("button.text.ok"),
			onActivateFunction: function() {
				submitForm();
			}
		});
		$('#feedbackAndComments').text(L10n.getString("submitfeedback.buttontext"));
		$('#feedbackAndComments').on('click', function() {
			self.show();
		});
	};
	
	var submitForm = function() {
		$.ajax({
			type: 'POST',
			url: 'php/submitFeedback.php',
			dataType: 'json',
			data: {
				email: $('#submitFeedback_email').val(),
				message: $('#submitFeedback_message').val(),
				magic: true
			},
			success: function(data) {
				alert(L10n.getString("submitfeedback.success"));
				modal.hide();
			}
		});
	};
	
	var populateForm = function() {
		modal.setContent(
			'<div class="submitFeedback standardForm">' +
				'<p><b>'+L10n.getString("submitfeedback.title")+'</b></p>' +
				
				'<p>'+L10n.getString('submitfeedback.body') +'</p>' +

				'<p>'+L10n.getString('submitfeedback.email') +'<br/>' +
				'<input type="text" class="text" id="submitFeedback_email" value=""></p>' +
				
				'<p>'+L10n.getString('submitfeedback.message') +'<br/>' +
				'<textarea id="submitFeedback_message"></textarea></p>' +
			'</div>');
			
		if (gui.userManager.authenticated) {
			$('#submitFeedback_email').val(gui.userManager.userData.emailAddress);
		}
	};
	
	this.show = function() {
		populateForm();
		modal.show();
		$('#submitFeedback_email').focus();
	};
	
	construct();
	
};
	

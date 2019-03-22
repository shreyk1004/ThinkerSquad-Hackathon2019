import { Component } from '@angular/core';

import { LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
// import { Storage } from '@ionic/storage';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
// import { variable } from '@angular/compiler/src/output/output_ast';


@Component({
	selector: 'app-tab2',
	templateUrl: 'tab2.page.html',
	styleUrls: ['tab2.page.scss']
})
export class Tab2Page
{
	private cameraOptions: CameraOptions = {
		quality: 100,
		destinationType: this.camera.DestinationType.DATA_URL,
		encodingType: this.camera.EncodingType.JPEG,
		mediaType: this.camera.MediaType.PICTURE
	};

	private galleryOptions: CameraOptions = {
		sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM,
		destinationType: this.camera.DestinationType.DATA_URL

	}

	// this is the request object in JSON format for google vision api
	// google vision api requires you to make a "POST" request and send the image and what you want to do in JSON format
	// the vision api servers responds back in JSON format too.

	google_vision_request = {requests: [{image: {content: ""}, features: [{type: 'TEXT_DETECTION'}, {type: 'DOCUMENT_TEXT_DETECTION'} ] } ] };
	google_vision_api_url = "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBbzVXb29nv3nX39EUA-5KOGYTwN2nIuXQ";

	// the camera_image variable will contain the image selected from the camera/gallery
	// this variable can be used in the html file using the syntax {{camera_image}}
	camera_image: any;

	// the image_text variable will contain the text recognized after calling the google vision api
	// this variable can be used in the html file using the syntax {{image_text}}
	// you may have to write logic to parse the recognized text ( break it into an array as it will have multiple lines seperated by a "\n")
	image_text: string;

	medicines: string[];

	constructor(private loadingCtrl: LoadingController, 
		private httpClient: HttpClient, private camera: Camera) {
	}

	async uploadFromCamera()
	{
		// uploadingspinner displays a message to the user that image is uploading and requires him/her to wait. 
		// when this spinner is displayed the user cannot click on anything on the app. It prevents the user from accidently starting multiple uploads
		var uploadingSpinner = await this.loadingCtrl.create({ message: 'Uploading images...' });
		try
		{
		// show the spinner		
			await uploadingSpinner.present();

			console.log("Calling takeCameraPicture");

			// call the function takeCamera to take a picture and store the picture on the variable image
			// the function returns the image in base64 format. Base64 is a special format that lets you represent binary data like photos in Ascii format so it can be stored as a string
			var image = await this.takeCameraPicture();
			// add a prefix to the image to say it is a jpg image and in base64 format. this is required to display it correctly in the html
			this.camera_image = "data:image/jpg;base64," + image;

			// set the image in the json request object to the image captured from the camera
			this.google_vision_request.requests[0].image.content = image;

			console.log("Google request object: " + JSON.stringify(this.google_vision_request));

			// make an HTTP Post request to Google vision api URL and pass the request variable 'google_vision_request' as a JSON string.
			this.httpClient.post(this.google_vision_api_url, JSON.stringify(this.google_vision_request)).subscribe( 
				responses =>
				{
					console.log("google response:  " + responses);
					// google sends the response back as a JSON. you need to stringify it and parse it back to convert it into an object
					var response_string = JSON.stringify(responses);
					console.log("google response string :  " + response_string);
					var responseObj = JSON.parse(response_string);

					// responseObj variable contains all the results.
					console.log(responseObj.responses[0].fullTextAnnotation.text);

					// get the result from responseObj and set it to the variable image_text (this is being used in html to display )
					this.image_text = responseObj.responses[0].fullTextAnnotation.text;

					// dismiss the spinner since the image is loaded and we have the result from google vision
					uploadingSpinner.dismiss();
				}, 
				error => 
				{
					console.log("Error from http request " + error.error);
				}
			);
		}
		catch(error)
		{
		  console.log(error);
		  uploadingSpinner.dismiss();
		}
	}

	async uploadFromGallery()
	{
		// uploadingspinner displays a message to the user that image is uploading and requires him/her to wait. 
		// when this spinner is displayed the user cannot click on anything on the app. It prevents the user from accidently starting multiple uploads

		var uploadingSpinner = await this.loadingCtrl.create({ message: 'Uploading images...' });
		try
		{
			await uploadingSpinner.present();

			// call the function takeCamera to take a picture and store the picture on the variable image
			// the function returns the image in base64 format. Base64 is a special format that lets you represent binary data like photos in Ascii format so it can be stored as a string

			// call the function takeGalleryPicture to take a picture from gallery and store the picture on the variable image
			// the function rseturns the image in base64 format. Base64 is a special format that lets you represent binary data like photos in Ascii format so it can be stored as a string
			var image = await this.takeGalleryPicture();
			// add a prefix to the image to say it is a jpg image and in base64 format. this is required to display it correctly in the html		  
			this.camera_image = "data:image/jpg;base64," + image ;

			// set the image in the json request object to the image captured from the camera
			this.google_vision_request.requests[0].image.content = image;

			console.log("Google request object: " + JSON.stringify(this.google_vision_request));

			// make an HTTP Post request to Google vision api URL and pass the request variable 'google_vision_request' as a JSON string.
			this.httpClient.post(this.google_vision_api_url,JSON.stringify(this.google_vision_request)).subscribe( responses =>
			{
				console.log("google response:  " + responses);
				var response_string = JSON.stringify(responses);
				console.log("google response string :  " + response_string);
				var responseObj = JSON.parse(response_string);
				// responseObj variable contains all the results.
				console.log(responseObj.responses[0].fullTextAnnotation.text);

				// get the result from responseObj and set it to the variable image_text (this is being used in html to display )
				this.image_text = responseObj.responses[0].fullTextAnnotation.text;

				// dismiss the spinner since the image is loaded and we have the result from google vision
				uploadingSpinner.dismiss();
		  });

		} catch(error)
		{
		  console.log(error);
		  uploadingSpinner.dismiss();
		}
	} 

	async takeCameraPicture()
	{
		console.log("In takeCameraPicture");
		// take a picture
		const image: string = await this.camera.getPicture(this.cameraOptions);

		await this.camera.cleanup();
		return image;    
	}

	async takeGalleryPicture()
	{
		console.log("In takeCameraPicture");
		// load from gallery, note that the fuction called on camera object is same but the options passed to it are different.
		const image: string = await this.camera.getPicture(this.galleryOptions);

		await this.camera.cleanup();
		return image;    
	}

	scheduleNotification(medicine)
	{
		this.medicines = this.image_text.split(" ");
		alert("User clicked on " + medicine);
	}
}

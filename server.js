const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const assert = require('assert');
const ExifImage = require('exif').ExifImage;


app.set('view engine', 'ejs');
app.use(fileUpload());
app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
	res.render('index', { msg: null });
});

app.post('/result', function (req, res) {
	var file = req.files.photo;
	if (!isFileImage(file)) {
		res.render('message', { title: 'Error', msg: 'The uploaded file should be a image.' });
	} else {
		try {
			new ExifImage({ image: file.data }, function (error, exifData) {
				if (error) {
					res.render('message', { title: 'Error', msg: error.message });
				} else {
					var title = req.body.title ? req.body.title : ""
					var description = req.body.description ? req.body.description : ""
					var make = exifData['image']['Make'] ? exifData['image']['Make'] : "";
					var model = exifData['image']['Model'] ? exifData['image']['Model'] : "";
					var created = exifData['exif']['CreateDate'] ? exifData['exif']['CreateDate'] : "";
					if (exifData['gps']['GPSLatitude'] && exifData['gps']['GPSLongitude']) {
						var latitudeRef = exifData['gps']['GPSLatitudeRef'];
						var longitudeRef = exifData['gps']['GPSLongitude'];
						var lat = exifData['gps']['GPSLatitude'];
						var latitude = lat[0] + lat[1] / 60 + lat[2] / 3600;
						var lon = exifData['gps']['GPSLongitude'];
						var longitude = lon[0] + lon[1] / 60 + lon[2] / 3600;
						if (latitudeRef == 'S') {
							latitude = -latitude
						}
						if (longitudeRef == 'W') {
							longitude = -longitude
						}
					} else {
						latitude = "";
						longitude = "";
					}
					if (make || model || created || latitude || longitude)
						res.render('display', { title: title, description: description, mimetype: file.mimetype, data: file.data.toString('base64'), make: make, model: model, created: created, latitude: latitude, longitude: longitude });
					else
						res.render('message', { title: 'Error', msg: 'No Exif segment found in the given image.' });
				}
			});
		} catch (error) {
			res.render('message', { title: 'Error', msg: error.message });
		}
	}
});

app.get('/map/:latitude/:longitude', function (req, res) {
	res.render('map', { latitude: req.params.latitude, longitude: req.params.longitude });
});

function isFileImage(file) {
	return file.mimetype.substring(0, 5) == 'image';
}

app.listen(app.listen(process.env.PORT || 5000));
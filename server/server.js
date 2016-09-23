//TODO Clean up email html
const express = require('express'),
    expressValidator = require('express-validator'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    axios = require('axios'),
    nodemailer = require('nodemailer');

//NOTE: Mailchimp uses HTTP Basic Auth. Set 'username' as any string ex: 'apiKey', 'helloWorld'

const app = express();

//TODO Remove in production
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
app.use(bodyParser.json());

// validate user input
app.use(expressValidator());

app.set('port', (process.env.PORT || 3001));

// Downloads virtual path
app.use('/downloads', express.static(__dirname + '/public'));

// returns promise
const subscribeUser = (email) => {
    return new Promise((resolve, reject) => { // eslint-disable-line no-undef
        axios({
            method: 'post',
            url: `${process.env.MAIL_CHIMP_ROOT_URL}/`,
            data: {
                email_address: email,
                status: 'subscribed'
            },
            auth: {
                username: 'apiKey',
                password: process.env.MAIL_CHIMP_API
            }
        })
            .then(({data: user}) => {
                resolve(user);
            })
            .catch(({response: {data: err}}) => {
                reject(err);
            });
    });
};
// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'decodemtl@gmail.com',
        pass: process.env.GMAIL_PASS
    }
});

app.post('/apply', (req, res) => {
    //Sanitize user input
    Object.keys(req.body).forEach(input => req.sanitize(input).escape());

    //User input data
    const data = req.body;
    console.log(data);
    // setup e-mail data
    //proceed editing at own risk
    const mailOptions = {
        from: '"DecodeMTL Bot "<decodemtl@gmail.com>', // sender address
        to: 'hello@decodemtl.com', // list of receivers
        subject: 'New Application from ' + data['first-name'] + ' ' + data['last-name'] + '', // Subject line
        text: 'New Application', // plaintext body
        html: `<div>
                <p>First Name: ${data['first-name']}</p>
                <p>Last Name: ${data['last-name']}</p>
                <p>Email: ${data['email']}</p>
                <p>Phone: ${data['tel']}</p>
                ${data['linkedin'] ? '<p>LinkedIn: ' + data["linkedin"] + '</p>' : ''}
                <p>Which course are you applying to: ${data['course']}</p>
                <p>Technical Knowledge: ${data['tech-background']}</p>
                ${data['hope'] && Array.isArray(data['hope']) ? '<p>Goals:</p><ul>' + data['hope'].map(goal => ('<li>' + goal + '</li>')).join('') + '</ul>' : data['hope'] ? '<p>Goal: ' + data['hope'] + '</p>' : ''}
                <p>About yourself: ${data['message']}</p>
               </div>` // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return res.json({status: 'failed', error});
        }
        console.log('Message sent: ' + info.response);
        if (req.body['list-optin'] && req.body['list-optin'] === 'yes') {
            return subscribeUser(data.email)
                .then(response => {
                    res.json({status: 'success', sub_status: 'success'});
                })
                .catch(err => {
                    res.json({status: 'success', sub_status: 'failed'});
                });
        }
        res.json({status: 'success'})
    });
});

app.post('/newsletter', (req, res) => {

    req.sanitize('email').escape();

    const {email} = req.body;

    subscribeUser(email)
        .then(response => {
            res.json({status: 'success'});
        })
        .catch(error => {
            if (error.title === 'Member Exists') {
                return res.json({status: 'success'});
            }
            res.json({status: 'failed', error});
        });
});

app.post('/visit', (req, res) => {

    req.sanitize('email').escape();

    const {email} = req.body;

    // setup e-mail data
    //proceed editing at own risk
    const mailOptions = {
        from: '"DecodeMTL Bot "<decodemtl@gmail.com>', // sender address
        to: 'hello@decodemtl.com', // list of receivers
        subject: 'New Visit Request', // Subject line
        text: 'Someone wants to schedule a visit.', // plaintext body
        html: `<div>
                <p>Here is the email: ${email}</p></div>` // html body
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return res.json({error, status: 'failed'});
        }
        console.log('Message sent: ' + info.response);
        res.json({status: 'success'})
    });
});

app.post('/contact', (req, res) => {
    //Sanitize user input
    Object.keys(req.body).forEach(input => req.sanitize(input).escape());

    // User input data
    const data = req.body;

    // setup e-mail data
    const mailOptions = {
        from: '"DecodeMTL Bot "<decodemtl@gmail.com>', // sender address
        to: 'hello@decodemtl.com', // list of receivers
        subject: 'New Message from ' + data['first-name'] + ' ' + data['last-name'] + '', // Subject line
        text: 'New Message', // plaintext body
        html: `<div>
                <p>First Name: ${data['first-name']}</p>
                <p>Last Name: ${data['last-name']}</p>
                <p>Email: ${data['email']}</p>
                <p>Phone: ${data['tel']}</p>
                <p>Message: ${data['message']}</p>
               </div>` // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return res.json({error, status: 'failed'});
        }
        console.log('Message sent: ' + info.response);
        if (req.body['list-optin'] && req.body['list-optin'] === 'yes') {
            return subscribeUser(data.email)
                .then(response => {
                    res.json({status: 'success', sub_status: 'success'});
                })
                .catch(err => {
                    res.json({status: 'success', sub_status: 'failed'});
                });
        }
        res.json({status: 'success'})
    });

});

app.listen(app.get('port'), () => {
    console.log(`API server running on port ${app.get('port')}`); // eslint-disable-line no-console
});
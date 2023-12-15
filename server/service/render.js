const axios = require('axios');

exports.home = (req, res) =>
{
    res.render('Home');
};

exports.aboutus = (req, res) =>
{
    res.render('AboutUS');
};

exports.loginPage = (req, res) =>
{
    res.render('Login');
};

exports.registerStudent = (req, res) =>
{
    res.render('registerStudent');
};

exports.registerCompany = (req, res) =>
{
    res.render('registerCompany');
};

exports.viewCompany = (req, res) =>
{
    res.render('studentCompanyDetails');
};

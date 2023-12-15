const bcrypt = require('bcrypt');
const { student, company, admin, job, studentJob, studentPlaced } = require('../model/model');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const excelJS = require('exceljs')
require('dotenv').config({ path: 'config.env' });

const cookie_expires_in = 24 * 60 * 60 * 1000;

const generateToken = (id, email, role) =>
{
    return jwt.sign(
        { id, email, role },
        process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

exports.home = async (req, res) =>
{
    const token = req.cookies.jwt;
    if (token) {
        res.render('Home', { flag: true });
    }
    else {
        res.render('Home', { flag: false });
    }
};

/**
  * @description Login Utility Function
  */
exports.findPerson = async (req, res) =>
{
    const email = req.body.email;
    const role = req.body.role;
    const password = req.body.password;

    // console.log(email, role, password);
    if (role == "Student") {
        await student.find({ email: email })
            .then((data) =>
            {
                if (!data) {
                    res
                        .status(404)
                        .render('error', { message: `Not found user with email: ${email} ` });
                } else {
                    if (!bcrypt.compareSync(password, data[0].password)) {
                        res
                            .status(500)
                            .render('error', { message: `Password Invalid` });
                        return;
                    }
                    // create token
                    const token = generateToken(data[0]._id, email, role);
                    // console.log(token);
                    res.cookie("jwt", token, { maxAge: cookie_expires_in, httpOnly: true });
                    res.redirect('/profile');
                }
            })
            .catch((err) =>
            {
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
    else if (role == "Company") {
        await company.find({ email: email })
            .then((data) =>
            {
                if (!data) {
                    // Make new webpage for all not found errors
                    res
                        .status(404)
                        .render('error', { message: `Not found Company with email: ${email} ` });
                } else {
                    if (!bcrypt.compareSync(password, data[0].password)) {
                        res
                            .status(500)
                            .render('error', { message: `Password Invalid` });
                        return;
                    }
                    // create token
                    const token = generateToken(data[0]._id, email, role);
                    // console.log(token); 
                    res.cookie("jwt", token, { maxAge: cookie_expires_in, httpOnly: true });
                    res.redirect('/profile');
                }
            })
            .catch((err) =>
            {
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
    else {
        await admin.find({ email: email })
            .then(async (data) =>
            {
                if (!data) {
                    // Make new webpage for all not found errors
                    res
                        .status(404)
                        .render('error', { message: `Not found admin with email: ${email} ` });
                } else {
                    // initialize cookie with role student and email
                    if (data[0].role == 1) {
                        if (role === "Placement Manager") {
                            if (!bcrypt.compareSync(password, data[0].password)) {
                                res
                                    .status(500)
                                    .render('error', { message: `Password Invalid` });
                                return;
                            }
                            // create token
                            const token = generateToken(data[0]._id, email, role);
                            // console.log(token);
                            res.cookie("jwt", token, { maxAge: cookie_expires_in, httpOnly: true });
                            res.redirect('/profile');
                        }
                        else {
                            res
                                .status(500)
                                .render('error', { message: `Error retrieving user with role ${role}` });
                        }
                    }
                    else {
                        if (role === "Admin") {
                            if (!bcrypt.compareSync(password, data[0].password)) {
                                res
                                    .status(500)
                                    .render('error', { message: `Password Invalid` });
                                return;
                            }
                            // create token
                            const token = await generateToken(data[0]._id, email, role);
                            // console.log(token);
                            res.cookie("jwt", token, { maxAge: cookie_expires_in, httpOnly: true });
                            res.redirect('/profile');
                            return;
                        }
                        else {
                            res
                                .status(500)
                                .render('error', { message: `Error retrieving user with role ${role}` });
                        }
                    }
                }
            })
            .catch((err) =>
            {
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
};

/**
  * @description Already logged in
  */
exports.alreadyLoggedIn = async (req, res) =>
{
    const _id = req.id;
    const email = req.email;
    const role = req.role;
    // console.log(email, role, _id);

    if (role == "Student") {
        await student.findById(_id)
            .then(async (data) =>
            {
                if (!data) {
                    res
                        .status(404)
                        .render('error', { message: `Not found user with email: ${email} ` });
                } else {
                    const link = await studentPlaced.findOne({ student: data._id });
                    let jobData = null;
                    if (link) {
                        jobData = await job.findById(link.job);
                    }
                    const sendData = { student: data, job: jobData };
                    res.render('studentProfile', { student: sendData });
                }
            })
            .catch((err) =>
            {
                // console.log(err);
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
    else if (role == "Company") {
        await company.findById(_id)
            .then(async (data) =>
            {
                if (!data) {
                    // Make new webpage for all not found errors
                    res
                        .status(404)
                        .render('error', { message: `Not found Company with email: ${email} ` });
                } else {
                    // console.log(jobs);
                    if (data.isVerified) {
                        const jobs = await job.find({ comp: data._id }).exec();
                        res.render('Profile', { company: data, jobs });
                    }
                    else {
                        res.render('Profile', { company: data });
                    }
                }
            })
            .catch((err) =>
            {
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
    else {
        await admin.findById(_id)
            .then(async (data) =>
            {
                if (!data) {
                    // Make new webpage for all not found errors
                    res
                        .status(404)
                        .render('error', { message: `Not found admin with email: ${email} ` });
                } else {
                    const placedStudent = await student.find({ isPlaced: true }).exec();
                    const totalStudent = await student.find().exec();
                    const placed = (placedStudent.length * 100) / totalStudent.length;

                    const A1jobs = await job.find({ isVerified: true, ctc: { $gte: 10.0 } }).exec();
                    const totalJobs = await job.find({ isVerified: true }).exec();
                    const a1 = (A1jobs.length * 100) / totalJobs.length;

                    // console.log(placed, a1);
                    if (data.role == 1) {
                        if (role === "Placement Manager") {
                            res.render('adminHome', { admin: data, placed: placed, a1: a1, isSuperAdmin: true });
                        }
                        else {
                            res
                                .status(500)
                                .render('error', { message: `Error retrieving user with role ${role}` });
                        }
                    }
                    else {
                        if (role === "Admin") {
                            res.render('adminHome', { admin: data, placed: placed, a1: a1, isSuperAdmin: false });
                            return;
                        }
                        else {
                            res
                                .status(500)
                                .render('error', { message: `Error retrieving user with role ${role}` });
                        }
                    }
                }
            })
            .catch((err) =>
            {
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
};

/**
  * @description Register Utility Functions
  */
// Register student
exports.registerStudent = async (req, res) =>
{
    // validate request
    if (!req.body) {
        res
            .status(400)
            .render('error', { message: 'Content can not be empty!' });
        return;
    }

    if (req.body.password !== req.body.confirmPassword) {
        res
            .status(500)
            .render('error', { message: 'Password do not match!!' });
        return;
    }

    // console.log(req.body);
    await bcrypt.hash(req.body.password, saltRounds)
        .then((hashedPassword) =>
        {
            // new student
            const user = new student({
                email: req.body.email,
                password: hashedPassword,
                firstName: req.body.firstName,
                middleName: req.body.middleName,
                lastName: req.body.lastName,
                dob: req.body.dob,
                gender: req.body.gender,
                mobileNumber: req.body.mobileNumber,
                alternateMobileNumber: req.body.alternateMobileNumber,
                tenthPercentage: req.body.tenthPercentage,
                twelfthPercentage: req.body.twelfthPercentage,
                cpi: req.body.cpi,
                activeBacklog: req.body.activeBacklog,
                totalBacklog: req.body.totalBacklog,
                branch: req.body.branch,
                resume: req.body.resume,
            })

            // save student in the database
            user
                .save(user)
                .then(data =>
                {
                    const token = generateToken(data._id, user.email, "Student");
                    res.cookie("jwt", token, { maxAge: cookie_expires_in, httpOnly: true });
                    res.redirect('/profile');
                    // res.send(data);
                })
                .catch(err =>
                {
                    res
                        .status(500)
                        .render('error', {
                            message: err.message || 'Some error occured  while creating a create operation',
                        });
                });
        })
        .catch(err =>
        {
            res
                .status(500)
                .render('error', { message: err.message || 'Some error occured while hashing password' });
        })
}

// Register company
exports.registerCompany = async (req, res) =>
{
    // validate request
    if (!req.body) {
        res
            .status(400)
            .render('error', { message: 'Content can not be empty!' });
        return;
    }

    if (req.body.confirmPassword !== req.body.password) {
        // make new webpage for any type for error
        res
            .status(400)
            .render('error', { message: "Confirm Password doesn't matched" });
        return;
    }

    // console.log(req.body);
    await bcrypt.hash(req.body.password, saltRounds)
        .then((hashedPassword) =>
        {
            // new company
            const user = new company({
                email: req.body.email,
                website: req.body.website,
                companyName: req.body.companyName,
                hrName: req.body.hrName,
                contactNumber: req.body.contactNumber,
                password: hashedPassword,
            })

            // save company in the database
            user
                .save(user)
                .then((data) =>
                {
                    const token = generateToken(data._id, data.email, "Company");
                    res.cookie("jwt", token, { maxAge: cookie_expires_in, httpOnly: true });
                    res.redirect('/profile');

                })
                .catch(err =>
                {
                    res
                        .status(500)
                        .render('error', {
                            message: err.message || 'Some error occured  while creating a create operation',
                        });
                });
        })
        .catch(err =>
        {
            res
                .status(500)
                .render('error', { message: err.message || 'Some error occured while hashing password' });
        })
}

// Register company
exports.registerAdmin = async (req, res) =>
{
    // validate request
    if (!req.body) {
        res
            .status(400)
            .render('error', { message: 'Content can not be empty!' });
        return;
    }


    if (req.body.confirmPassword !== req.body.password) {
        // make new webpage for any type for error
        res
            .status(400)
            .render('error', { message: "Confirm Password doesn't matched" });
        return;
    }

    await bcrypt.hash(req.body.password, saltRounds)
        .then((hashedPassword) =>
        {
            // new company
            const user = new admin({
                email: req.body.email,
                password: hashedPassword,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
            })

            // save company in the database
            user
                .save(user)
                .then((data) =>
                {
                    const token = generateToken(data._id, user.email, "Admin");
                    res.cookie("jwt", token, { maxAge: cookie_expires_in, httpOnly: true });
                    res.send(data);
                })
                .catch(err =>
                {
                    res
                        .status(500)
                        .render('error', {
                            message: err.message || 'Some error occured  while creating a create operation',
                        });
                });
        })
        .catch(err =>
        {
            res
                .status(500)
                .render('error', { message: err.message || 'Some error occured while hashing password' });
        })
}

/**
  * @description Routing update request to particular role (kind of serving related webpage to logged in role)
  */
exports.updateUser = async (req, res) =>
{
    const email = req.email;
    const role = req.role;
    const id = req.id;

    if (role == "Student") {
        await student.find({ _id: id })
            .then((data) =>
            {
                // render to update student page ex. {/updateStudent/:id}
                res.render('studentEditProfile', { student: data[0] });
            })
            .catch((err) =>
            {
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
    else if (role == "Company") {
        await company.find({ _id: id })
            .then((data) =>
            {
                // render to update company page ex. {/updateCompany/:id}
                res.render('companyEditProfile', { company: data[0] });
            })
            .catch((err) =>
            {
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
    else {
        await admin.find({ _id: id })
            .then((data) =>
            {
                // initialize cookie with role student and email
                if (data[0].role == 1) {
                    if (role === "Placement Manager") {
                        // render to update placement manager page ex. {/updateSuperAdmin/:id}
                        res.send(data);
                    }
                    else {
                        res
                            .status(500)
                            .render('error', { message: `Error retrieving user with role ${role}` });
                    }
                }
                else {
                    if (role === "Admin") {
                        // render to update admin page ex. {/updateAdmin/:id}
                        res.send(data);
                    }
                    else {
                        res
                            .status(500)
                            .render('error', { message: `Error retrieving user with role ${role}` });
                    }
                }
            })
            .catch((err) =>
            {
                res
                    .status(500)
                    .render('error', { message: `Error retrieving user with email ${email}` });
            });
    }
}

/**
  * @description Individual user update request to database
  */
exports.updateStudent = async (req, res) =>
{
    if (!req.body) {
        return res
            .status(400)
            .render('error', { message: 'Data to update can not be empty' });
    }

    const id = req.id;
    const role = req.role;
    if (role !== "Student") {
        res
            .status(500)
            .render('error', { message: 'Role not matched' });
        return;
    }

    const stored = req.body;
    // console.log(stored);
    await student.findByIdAndUpdate(id, stored, { useFindAndModify: false })
        .then((data) =>
        {
            if (!data) {
                res
                    .status(400)
                    .render('error', { message: `Cannot update student with ${id}. May be user not found!` })
            } else {
                res.redirect('/profile');
            }
        })
        .catch(err =>
        {
            res
                .status(500)
                .render('error', { message: 'Error update student information' });
        })
}

exports.updateCompany = async (req, res) =>
{
    if (!req.body) {
        return res
            .status(400)
            .render('error', { message: 'Data to update can not be empty' });
    }

    const id = req.id;
    const role = req.role;

    if (role !== "Company") {
        res
            .status(500)
            .render('error', { message: 'Role not matched' });
        return;
    }
    const stored = req.body;
    await company.findByIdAndUpdate(id, stored, { useFindAndModify: false })
        .then((data) =>
        {
            if (!data) {
                res
                    .status(400)
                    .render('error', { message: `Cannot update company with ${id}. May be user not found!` })
            } else {
                res.redirect('/profile');
            }
        })
        .catch(err =>
        {
            res
                .status(500)
                .render('error', { message: 'Error update company information' });
        })
}

exports.updateAdmin = async (req, res) =>
{
    if (!req.body) {
        return res
            .status(400)
            .render('error', { message: 'Data to update can not be empty' });
    }

    const id = req.id;
    const role = req.role;

    if (role !== "Placement Manager" && role !== "Admin") {
        res
            .status(500)
            .render('error', { message: 'Role not matched' });
        return;
    }

    const stored = req.body;
    await admin.findByIdAndUpdate(id, stored, { useFindAndModify: false })
        .then((data) =>
        {
            if (!data) {
                res.status(400).render('error', { message: `Cannot update admin with ${id}. May be user not found!` })
            } else {
                res.redirect('/profile');
            }
        })
        .catch(err =>
        {
            res.status(500).render('error', { message: 'Error update admin information' });
        })
}


exports.updatePassword = async (req, res) =>
{
    const email = req.email;
    const role = req.role;
    const id = req.id;

    if (role == "Student") {
        const stu = await student.findById(id);
        res.render('studentUpdatePassword', { student: stu });
    }
    else if (role == "Company") {
        const comp = await company.findById(id);
        res.render('companyUpdatePassword', { company: comp });
    }
    else {
        if (role == "Admin")
            res.render('adminUpdatePassword', { isSuperAdmin: false });
        else
            res.render('adminUpdatePassword', { isSuperAdmin: true });
    }
}

exports.studentUpdatePassword = async (req, res) =>
{
    const role = req.role;
    if (role !== "Student") {
        res.status(500).render('error', { message: 'Role not matched.' });
        return;
    }

    // console.log(req.body);
    const old = req.body.password;
    const newP = req.body.newPassword;
    const newCP = req.body.newConfirmPassword;

    if (newP !== newCP) {
        res.status(500).render('error', { message: 'Confirm Password not matched' });
        return;
    }

    const id = req.id;

    await student.findById(id)
        .then(async (data) =>
        {
            if (!bcrypt.compareSync(old, data.password)) {
                res
                    .status(500)
                    .render('error', { message: `Old Password InCorrect` });
                return;
            }

            await bcrypt.hash(newP, saltRounds)
                .then(async (hashedPassword) =>
                {
                    // console.log(old);
                    // console.log(newP, hashedPassword);
                    await student.findByIdAndUpdate(id, { password: hashedPassword })
                        .then(async (data) =>
                        {
                            res.redirect('/profile');
                        })
                        .catch(async (err) =>
                        {
                            res
                                .status(500)
                                .render('error', { message: `Error occured while finding user` });
                            return;
                        })
                })
                .catch(err =>
                {
                    res
                        .status(500)
                        .render('error', { message: `Internal Server Error! Please try again` });
                    return;
                })
        })
        .catch(async (err) =>
        {
            res
                .status(500)
                .render('error', { message: `Error occured while finding user` });
            return;
        })


}

exports.companyUpdatePassword = async (req, res) =>
{
    const role = req.role;
    if (role !== "Company") {
        res.status(500).render('error', { message: 'Role not matched.' });
        return;
    }

    // console.log(req.body);
    const old = req.body.password;
    const newP = req.body.newPassword;
    const newCP = req.body.newConfirmPassword;

    if (newP !== newCP) {
        res.status(500).render('error', { message: 'Confirm Password not matched' });
        return;
    }

    const id = req.id;

    await company.findById(id)
        .then(async (data) =>
        {
            if (!bcrypt.compareSync(req.body.password, data.password)) {
                res
                    .status(500)
                    .render('error', { message: `Old Password InCorrect` });
                return;
            }

            await bcrypt.hash(req.body.newPassword, saltRounds)
                .then(async (hashedPassword) =>
                {
                    await company.findByIdAndUpdate(id, { password: hashedPassword })
                        .then(async (data) =>
                        {
                            res.redirect('/profile');
                        })
                        .catch(async (err) =>
                        {
                            res
                                .status(500)
                                .render('error', { message: `Error occured while finding user` });
                            return;
                        })
                })
                .catch(err =>
                {
                    res
                        .status(500)
                        .render('error', { message: `Internal Server Error! Please try again` });
                    return;
                })
        })
        .catch(async (err) =>
        {
            res
                .status(500)
                .render('error', { message: `Error occured while finding user` });
            return;
        })
}

exports.adminUpdatePassword = async (req, res) =>
{
    const role = req.role;
    if (role !== "Admin" && role !== "Placement Manager") {
        res.status(500).render('error', { message: 'Role not matched.' });
        return;
    }

    // console.log(req.body);
    const old = req.body.password;
    const newP = req.body.newPassword;
    const newCP = req.body.newConfirmPassword;

    if (newP !== newCP) {
        res.status(500).render('error', { message: 'Confirm Password not matched' });
        return;
    }

    const id = req.id;

    await admin.findById(id)
        .then(async (data) =>
        {
            if (!bcrypt.compareSync(req.body.password, data.password)) {
                res
                    .status(500)
                    .render('error', { message: `Old Password InCorrect` });
                return;
            }

            await bcrypt.hash(req.body.newPassword, saltRounds)
                .then(async (hashedPassword) =>
                {
                    await admin.findByIdAndUpdate(id, { password: hashedPassword })
                        .then(async (data) =>
                        {
                            res.redirect('/profile');
                        })
                        .catch(async (err) =>
                        {
                            res
                                .status(500)
                                .render('error', { message: `Error occured while finding user` });
                            return;
                        })
                })
                .catch(err =>
                {
                    res
                        .status(500)
                        .render('error', { message: `Internal Server Error! Please try again` });
                    return;
                })
        })
        .catch(async (err) =>
        {
            res
                .status(500)
                .render('error', { message: `Error occured while finding user` });
            return;
        })
}

/**
  * @description Logout current user
  */
exports.logoutUser = async (req, res) =>
{
    res
        .clearCookie("jwt")
        .status(200)
        .redirect('/');

    // render the home page here
}

/**
  * @description Delete current user
  */
exports.deleteUser = async (req, res) =>
{
    const role = req.role;
    const id = req.id;

    // console.log(role);
    // console.log(id);

    if (role == "Student") {
        student.findByIdAndDelete(id)
            .then(data =>
            {
                if (!data) {
                    res.status(404).render('error', { message: `Cannot delete with id ${id}. Maybe ID is wrong!` })
                }
                else {
                    // res.render('error', { message: 'User was deleted successfully' });                    res.send('User was deleted successfully');
                    res.redirect('/logout');
                }
            })
            .catch(err =>
            {
                res.status(500).render('error', {
                    message: `Could not delete user with id=${id}`,
                });
            });
    }
    else if (role == "Company") {
        company.findByIdAndDelete(id)
            .then(data =>
            {
                if (!data) {
                    res.status(404).render('error', { message: `Cannot delete with id ${id}. Maybe ID is wrong!` })
                }
                else {
                    res.redirect('/logout');
                }
            })
            .catch(err =>
            {
                res.status(500).render('error', {
                    message: `Could not delete user with id=${id}`,
                });
            });
    }
    else {
        admin.findByIdAndDelete(id)
            .then(data =>
            {
                if (!data) {
                    res.status(404).render('error', { message: `Cannot delete with id ${id}. Maybe ID is wrong!` })
                }
                else {
                    res.redirect('/logout');
                }
            })
            .catch(err =>
            {
                res.status(500).render('error', {
                    message: `Could not delete user with id=${id}`,
                });
            });
    }
}

/**
  * @description Automate Mail
  */
exports.sendMail = async (req, res) =>
{
    const transporter = nodemailer.createTransport({
        service: "hotmail",
        auth: {
            user: "placementdaiict@outlook.com",
            pass: process.env.MAIL_PASS,
        },
    });

    const students = await student.find({ isPlaced: false, isVerified: true }).exec();
    const emails = [];
    for (let i = 0; i < students.length; i++) {
        emails.push(students[i].email);
    }
    if (emails.length == 0) {
        res.status(200).render('error', {
            message: "Currently, No Students are in the drive."
        });
    }
    if (!students) {
        res.status(200).render('error', {
            message: `All registered students are placed.`,
        });
        return;
    }

    const id = req.params.id;
    await job.findById(id)
        .then(async (data) =>
        {
            const companyId = data.comp;
            await company.findById(companyId)
                .then(async (companyData) =>
                {
                    const CompanyName = companyData.companyName;
                    const JobName = data.jobName;
                    const locations = data.postingLocation;
                    const openfor = data.ugCriteria;
                    const CpiCriteria = data.cpiCriteria;
                    const ctc = data.ctc;
                    const description = data.description;
                    const start_date = data.startDate;
                    const end_date = data.endDate;

                    const options = {
                        from: `placementdaiict@outlook.com`,
                        to: emails,
                        subject: `Registration is open for ${CompanyName}`,
                        text: ``,
                        html: `<p>Dear students, Upcoming placement drive of the company <b>${CompanyName}</b> is scheduled on ${start_date}</p>
                                <div><h4>Company Profile Details:<h4> </div>
                                <div><b>Registration Starts on:</b> ${start_date} </div>
                                <div><b>Registration Ends on:</b> ${end_date} </div>
                                <div><b>Open for:</b> ${openfor} </div>
                                <div><b>Posting Location(s):</b> ${locations} </div>
                                <div><b>Job Role:</b> ${JobName}</div>
                                <div><b>CPI Criteria:</b> ${CpiCriteria}</div>
                                <div><b>CTC(LPA):</b> ${ctc}</div>
                                <div><b>Description:</b> ${description} </div>
                                <br>
                                <div><b>Note:</b> All the students who are registering for a company are required to attend the company process and cannot back out from the same, for any reason. Anyone violating this norm will be strictly banned from the next eligible company.</div>
                                <br>
                                <div><b>Strict notice to all the students:</b> no late registrations will be entertained (no matter the reason). So, do keep in mind the registration deadline. Research about the company and the job profile before registering.</div> 
                                <br>
                                <div><i>Wish you luck!</i></div>
                                <br>
                                <div>Please Do Not Respond back to this E-mail as this is Auto Generated E-mail, contact us at <b>jatinranpariya1510@gmail.com</b> in case of any doubt.</div>
                                <br>
                                <div>Regards,</div>
                                <div>Placement Cell</div>`,
                    };

                    await transporter.sendMail(options, function (err, info)
                    {
                        if (err) {
                            console.log("Error occured", err);
                            return;
                        }
                        console.log("Mail Sent: ", info.response);
                    });

                    res.redirect('/adminInterviewSchedule');
                })
                .catch(err =>
                {
                    res.status(500).render('error', { message: 'Company not found' });
                })

        })
        .catch(err =>
        {
            res.status(500).render('error', { message: 'Job not found' });
        })
}

/**
  * @description Verification Functions
  */
exports.verifyStudent = async (req, res) =>
{
    const id = req.params.id;
    // console.log(id);
    if (id) {
        await student.findByIdAndUpdate(id, { isVerified: true }, { useFindAndModify: false })
            .then(async (data) =>
            {
                res.redirect("/unverifiedstudents");
            })
            .catch(err =>
            {
                res.status(500).render('error', { message: 'Student not found' });
            })
    }
    else {
        const students = await student.find({ isVerified: false }).exec();
        if (!students) {
            res.status(200).render('error', { message: 'All students are verified' });
            return;
        }

        res.send(students);
    }
}

exports.verifyJob = async (req, res) =>
{
    const id = req.params.id;
    if (id) {
        await job.findByIdAndUpdate(id, { isVerified: true }, { useFindAndModify: false })
            .then(async (data) =>
            {
                res.redirect("/unverifiedjobs")

            })
            .catch(err =>
            {
                res.status(500).render('error', { message: 'Job not found' });
            })
    }
    else {
        const jobs = await job.find({ isVerified: false }).exec();
        if (!jobs) {
            res.status(200).render('error', { message: 'All jobs are verified' });
            return;
        }
        res.send(jobs);
    }
}

exports.verifyCompany = async (req, res) =>
{
    const id = req.params.id;
    if (id) {
        await company.findByIdAndUpdate(id, { isVerified: true }, { useFindAndModify: false })
            .then(async (data) =>
            {
                res.redirect("/unverifiedcompany")
            })
            .catch(err =>
            {
                res.status(500).render('error', { message: 'Company not found' });
            })
    }
    else {
        const companies = await company.find({ isVerified: false }).exec();
        if (!companies) {
            res.status(200).render('error', { message: 'All companies are verified' });
            return;
        }

        res.send(companies);
    }
}


exports.postJob = async (req, res) =>
{
    // add job to jobSchema
    if (!req.body) {
        res.status(400).render('error', { message: 'Content can not be empty!' });
        return;
    }

    const comp = await company.findById(req.id).exec();
    let arr = [];
    if (req.body.btech)
        arr.push(req.body.btech);

    if (req.body.mtech)
        arr.push(req.body.mtech);

    if (req.body.msc)
        arr.push(req.body.msc);

    if (arr.length == 0) {
        res
            .status(404)
            .render('companyPostJob', { message: 'Please Enter Branch', name: comp.companyName });
        return;
    }
    // new student
    const user = await new job({
        comp: req.id,
        companyName: comp.companyName,
        jobName: req.body.jobName,
        postingLocation: req.body.postingLocation,
        ugCriteria: arr,
        cpiCriteria: req.body.cpiCriteria,
        ctc: req.body.ctc,
        description: req.body.description,
    })

    // save student in the database
    user
        .save(user)
        .then(async data =>
        {
            // redirect to company home page
            res.redirect('/profile');
        })
        .catch(err =>
        {
            res.status(500).render('error', {
                message: err.message || 'Some error occured  while creating a create operation',
            });
        });
};

exports.registredStudentsInJob = async (req, res) =>
{
    const jobID = req.params.id;
    studentJob.find({ job: jobID })
        .then(data =>
        {
            if (!data) {
                res.status(404).render('error', { message: "Not found Job with id " + jobID })
            } else {
                // console.log(jobID);
                studentJob.aggregate([
                    {
                        $lookup:
                        {
                            from: 'job',
                            localField: 'job',
                            foreignField: '_id',
                            as: 'studentjobsjoinjob'
                        }
                    }
                ])
                    .then(async (result) =>
                    {
                        const arrayOfStudents = [];
                        for (let index = 0; index < result.length; index++) {
                            // console.log(result[index]);
                            await student.find({ _id: result[index].student })
                                .then((result1) =>
                                {
                                    if (!result1) {
                                        res.status(404).render('error', { message: "Not found Student with id " + result[index].student })
                                    }
                                    else if (result[index].job == jobID) {
                                        arrayOfStudents.push(result1[0]);
                                    }
                                })
                                .catch((err) =>
                                {
                                    res.status(500).render('error', {
                                        message: err.message,
                                    });
                                });
                        }
                        const companyName = await job.findById(jobID);
                        // console.log(arrayOfStudents);
                        res.render('companyStudentList', { students: arrayOfStudents, name: companyName.companyName, jobId: jobID });
                    })
                    .catch((err) =>
                    {
                        res.status(500).render('error', {
                            message: err.message,
                        });
                    });
            }
        })
        .catch(err =>
        {
            res.status(500).render('error', { message: "Error retrieving Job with id " + jobID });
        })
};

exports.jobsRegistredbyStudent = (req, res) =>
{
    const studentID = req.query.studentID;
    studentJob.find({ student: studentID })
        .then(data =>
        {
            if (!data) {
                res.status(404).render('error', { message: "Not found Student with id " + studentID })
            } else {
                // console.log(jobID);
                studentJob.aggregate([
                    {
                        $lookup:
                        {
                            from: 'stuent',
                            localField: 'student',
                            foreignField: '_id',
                            as: 'studentjobsjoinstudent'
                        }
                    }
                ])
                    .then(async (result) =>
                    {
                        const arrayOfJobs = [];
                        for (let index = 0; index < result.length; index++) {
                            await job.find({ _id: result[index].job })
                                .then((result1) =>
                                {
                                    if (!result1) {
                                        res.status(404).render('error', { message: "Not found job with id " + result[index].job })
                                    }
                                    else {
                                        arrayOfJobs.push(result1[0]);
                                    }
                                })
                                .catch((err) =>
                                {
                                    res.status(500).render('error', {
                                        message: err.message,
                                    });
                                });
                        }
                        // console.log(arrayOfJobs);
                        res.send(arrayOfJobs);
                    })
                    .catch((err) =>
                    {
                        res.status(500).render('error', {
                            message: err.message,
                        });
                    });
            }
        })
        .catch(err =>
        {
            res.status(500).render('error', { message: "Error retrieving Student with id " + studentID });
        })
};

// Help student to register in Job
exports.registerStudentInJob = async (req, res) =>
{
    const jobID = req.params.id;
    const studentID = req.id;

    if (!req.body) {
        res.status(400).render('error', { message: 'Content can not be empty!' });
        return;
    }

    // new student
    const user = new studentJob({
        job: jobID,
        student: studentID,
    });

    // save student in the database
    user
        .save(user)
        .then(async (data) =>
        {
            res.redirect('/viewCompany');
        })
        .catch(err =>
        {
            res.status(500).render('error', {
                message: err.message || 'Some error occured  while creating a create operation',
            });
        });
};

exports.deregisterStudentInJob = async (req, res) =>
{
    const jobID = req.params.id;
    const studentID = req.id;
    // console.log(studentID, jobID);
    if (!req.body) {
        res.status(400).render('error', { message: 'Content can not be empty!' });
        return;
    }

    const entry = await studentJob.findOne({ job: jobID, student: studentID });
    await studentJob.findByIdAndDelete(entry._id)
        .then(async (data) =>
        {
            if (!data) {
                res.status(404).render('error', { message: `Cannot delete with id ${entry._id}. Maybe ID is wrong!` })
            }
            else {
                res.redirect('/viewCompany');
            }
        })
        .catch(err =>
        {
            res.status(500).render('error', {
                message: `Could not delete user with id=${id}`,
            });
        });
};

exports.updateJob = async (req, res) =>
{
    const jobID = req.params.id;
    if (!req.body) {
        res.status(400).render('error', { message: 'Content can not be empty!' });
        return;
    }
    const jobObject = await job.findById(jobID);
    res.render('companyEditJobs', { job: jobObject, message: null });
}

exports.updateJobPost = async (req, res) =>
{
    const id = req.params.id;
    // console.log(req.body);
    let arr = [];
    if (req.body.btech)
        arr.push(req.body.btech);

    if (req.body.mtech)
        arr.push(req.body.mtech);

    if (req.body.msc)
        arr.push(req.body.msc);

    if (arr.length == 0) {
        const jobb = await job.findById(id);
        res
            .status(404)
            .render('companyEditJobs', { message: 'Please Enter Branch', job: jobb });
        return;
    }
    // console.log(arr);

    const sendObject = {
        jobName: req.body.jobName,
        postingLocation: req.body.postingLocation,
        cpiCriteria: req.body.cpiCriteria,
        ctc: req.body.ctc,
        ugCriteria: arr,
        description: req.body.description
    };

    // console.log(sendObject);
    await job.findByIdAndUpdate(id, sendObject, { useFindAndModify: false })
        .then(async (data) =>
        {
            if (!data) {
                res.status(404).render('error', { message: "Cannot update job with id " + id });
            }
            else {
                res.redirect('/profile');
            }
        })
        .catch(err =>
        {
            res.status(500).render('error', { message: "Error updating job with id " + id })
        });
}

exports.deleteJob = async (req, res) =>
{
    const id = req.params.id;
    // console.log(id);
    await job.findByIdAndDelete(id)
        .then(async (data) =>
        {
            if (!data) {
                res.status(404).render('error', { message: "Cannot delete job with id " + id });
            }
            else {
                // console.log(data);
                res.redirect('/profile');
            }
        })
        .catch(err =>
        {
            res.status(500).render('error', { message: "Error deleting job with id " + id })
        });
}

exports.viewCompany = async (req, res) =>
{
    const id = req.id;
    const role = req.role;

    if (role === "Student" || role === "Admin" || role === "Placement Manager") {
        const data = await job.find({ isVerified: true }).exec();
        const registered = [], locations = [], jobTitles = [];

        for (let i = 0; i < data.length; i++) {
            locations.push(data[i].postingLocation);
            jobTitles.push(data[i].jobName);

            const jobID = data[i]._id;
            const ok = await studentJob.findOne({ job: jobID, student: id });
            if (ok)
                registered.push(1);
            else
                registered.push(0);
        }
        const user = await student.findById(id);
        const uniqueLocations = [...new Set(locations.map(item => item))];
        const uniquejobTitles = [...new Set(jobTitles.map(item => item))];

        res.render('studentCompanyDetails', { jobs: data, registered: registered, user: user, location: uniqueLocations, titles: uniquejobTitles });
    }
    else {
        res.render('error', { message: 'You have not access to the company list' });
    }
}

exports.showCompany = async (req, res) =>
{
    const id = req.id;
    const jobID = req.params.id;
    const jobDetails = await job.findById(jobID).exec();
    const user = await student.findById(id);
    // console.log(jobDetails);
    res.render('showCompany', { job: jobDetails, user: user });
}

exports.filter = async (req, res) =>
{
    const id = req.id;

    const query = { jobName: req.body.jobTitle, postingLocation: req.body.location, cpiCriteria: { $gte: req.body.cpi }, ctc: { $gte: req.body.ctc }, isVerified: true };

    if (req.body.jobTitle == "Any") {
        delete query.jobName;
    }
    if (req.body.location == "Any") {
        delete query.postingLocation;
    }
    if (req.body.cpi == "Any") {
        delete query.cpiCriteria;
    }
    if (req.body.ctc == "Any") {
        delete query.ctc;
    }

    job.find(query)
        .then(async (queryData) =>
        {
            if (!queryData) {
                res.status(404).render('error', { message: "Not Found" });
            }
            else {

                const finalQuery = [];
                if (req.body.branch !== "Any") {
                    for (let i = 0; i < queryData.length; i++) {
                        let flag = false;
                        for (let j = 0; j < queryData[i].ugCriteria.length; j++) {
                            if (queryData[i].ugCriteria[j] == req.body.branch) {
                                flag = true;
                                break;
                            }
                        }
                        if (flag) {
                            finalQuery.push(queryData[i]);
                        }
                    }
                } else {
                    for (let i = 0; i < queryData.length; i++) {
                        finalQuery.push(queryData[i]);
                    }
                }

                const registered = [], locations = [], jobTitles = [];

                for (let i = 0; i < queryData.length; i++) {
                    const jobID = queryData[i]._id;
                    const ok = await studentJob.findOne({ job: jobID, student: id });
                    if (ok)
                        registered.push(1);
                    else
                        registered.push(0);
                }

                const data = await job.find({ isVerified: true }).exec();
                for (let i = 0; i < data.length; i++) {
                    locations.push(data[i].postingLocation);
                    jobTitles.push(data[i].jobName);
                }

                const user = await student.findById(id);
                const uniqueLocations = [...new Set(locations.map(item => item))];
                const uniquejobTitles = [...new Set(jobTitles.map(item => item))];

                res.render('studentCompanyDetails', { jobs: finalQuery, registered: registered, user: user, location: uniqueLocations, titles: uniquejobTitles });
            }
        })
        .catch(err =>
        {
            res.status(500).render('error', { message: "Error while fetching data of requested query" })
        });
}

// Viraj
// generate datasheet for admin 
exports.datasheet = async (req, res) =>
{
    try {
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("Students");

        worksheet.columns = [
            { header: "FirstName", key: "firstName" },
            { header: "LastName", key: "lastName" },
            { header: "Email", key: "email" },
            { header: "Gender", key: "gender" },
            { header: "Mobile-Number", key: "mobileNumber" }
        ]

        let counter = 1;

        var userdata = await student.find({ isVerified: true, isPlaced: false, isRejected: false });
        let users = [];
        userdata.forEach((user) =>
        {
            worksheet.addRow(user);
        });

        worksheet.getRow(1).eachCell((cell) =>
        {
            cell.font = { bold: true };
        });
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
        );

        res.setHeader("Content-Disposition", `attachment; filename=studentData.xlsx`);

        return workbook.xlsx.write(res).then(() =>
        {
            res.status(200);
        });
    }
    catch (error) {
        res
            .status(404)
            .render('error', { message: "Error while generating datasheet" });
    }
};


// fetch data for admin to verify company(only super admin can verify company) , students , jobs : 
exports.verifycompany = async (req, res) =>
{
    let flag = false;
    if (req.role != "Admin") flag = true;
    const data = await company.find({ isVerified: false, isRejected: false }).exec();
    // console.log(data);
    res.render('adminVerifyCompany', { record: data, isSuperAdmin: flag });

}

exports.verifystudent = async (req, res) =>
{
    let flag = false;
    if (req.role != "Admin") flag = true;
    const data = await student.find({ isVerified: false, isRejected: false }).exec();
    // console.log(data);
    res.render('adminVerifyStudent', { record: data, isSuperAdmin: flag });

}

exports.verifyjob = async (req, res) =>
{
    let flag = false;
    if (req.role != "Admin") {
        flag = true;
    }
    const data = await job.find({ isVerified: false, isRejected: false }).exec();
    // console.log(data);
    res.render('adminVerifyJobs', { record: data, isSuperAdmin: flag });
}

/**
  * @description Verification Functions
*/
exports.rejectStudent = async (req, res) =>
{
    const id = req.params.id;
    // console.log(id);
    if (id) {
        await student.findByIdAndUpdate(id, { isRejected: true }, { useFindAndModify: false })
            .then(async (data) =>
            {
                res.redirect("/unverifiedstudents")
            })
            .catch(err =>
            {
                res.status(500).render('error', { message: 'Student not found' });
            })
    }
    else {
        const students = await student.find({ isRejected: true }).exec();
        if (!students) {
            res.status(200).send({ message: 'All students are verified' });
            return;
        }
        res.send(students);
    }
}

exports.rejectJob = async (req, res) =>
{
    const id = req.params.id;
    if (id) {
        await job.findByIdAndUpdate(id, { isRejected: true }, { useFindAndModify: false })
            .then(async (data) =>
            {
                res.redirect("/unverifiedjobs")

            })
            .catch(err =>
            {
                res.status(500).render('error', { message: 'Job not found' });
            })
    }
    else {
        const jobs = await job.find({ isRejected: true }).exec();
        if (!jobs) {
            res.status(200).send({ message: 'All jobs are verified' });
            return;
        }
        res.send(jobs);
    }
}

exports.rejectCompany = async (req, res) =>
{
    const id = req.params.id;
    await company.findByIdAndUpdate(id, { isRejected: true }, { useFindAndModify: false })
        .then(async (data) =>
        {
            res.redirect("/unverifiedcompany")
        })
        .catch(err =>
        {
            res.status(500).render('error', { message: 'Company not found' });
        })
}

exports.adminhome = async (req, res) =>
{
    let flag = false;
    if (req.role != "Admin") {
        flag = true;
    }
    res.render('adminHome', { isSuperAdmin: flag, placed: 30, male: 80 })
}

exports.adminStudents = async (req, res) =>
{
    let flag = false;
    if (req.role != "Admin") {
        flag = true;
    }

    const data = await student.find({}).exec();
    let sendData = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].isPlaced != true && data[i].isVarified == true && data[i].isRejected == false) {

        }
        else {
            const link = await studentPlaced.findOne({ student: data[i]._id });
            // console.log(link);
            if (!link) {
                sendData.push({ student: data[i], jobNameSend: "Not Placed", companyNameSend: "Not Placed" });
                continue;
            }
            const jobData = await job.findById(link.job);
            // console.log(jobData);
            sendData.push({ student: data[i], jobNameSend: jobData.jobName, companyNameSend: jobData.companyName });
        }
    }
    res.render('adminStudents', { students: sendData, isSuperAdmin: flag });

}

exports.adminJobs = async (req, res) =>
{
    let flag = false;
    if (req.role != "Admin") {
        flag = true;
    }

    const data = await job.find({}).exec();
    res.render('adminJobs', { jobs: data, isSuperAdmin: flag });
}

exports.adminCompany = async (req, res) =>
{
    let flag = false;
    if (req.role != "Admin") {
        flag = true;
    }

    const data = await company.find({}).exec();
    res.render('adminCompany', { company: data, isSuperAdmin: flag });
}


// need to modify from here 
exports.adminInterviewSchedule = async (req, res) =>
{
    let flag = false;
    if (req.role != "Admin") {
        flag = true;
    }
    const data = await job.find({ isRejected: false, isVerified: true }).exec();
    res.render('adminInterviewSchedule', { record: data, isSuperAdmin: flag });
}

exports.adminUpdateInterviewSchedule = async (req, res) =>
{
    if (!req.body) {
        return res
            .status(400)
            .render('error', { message: 'Data to update can not be empty' });
    }

    const id = req.params.id;
    const sd = new Date(req.body.startDate);
    const ed = new Date(req.body.endDate);

    job.findByIdAndUpdate(id, { startDate: sd, endDate: ed }, { useFindAndModify: false })
        .then(async (data) =>
        {
            res.redirect(`/mail/${id}`);
        })
        .catch((err) =>
        {
            res.status(500).render('error', { message: "Error occured" });
        })
}

exports.unplacedstudent = async (req, res) =>
{
    const id = req.params.id;
    // console.log(id);
    if (id) {
        await student.findByIdAndUpdate(id, { isPlaced: true }, { useFindAndModify: false })
            .then(async (data) =>
            {
                const std = await studentJob.find({ student: id }).exec();
                for (let i = 0; i < std.length; i++) {
                    await studentJob.findByIdAndDelete(std[i]._id);
                }
                res.redirect("/adminStudents");
            })
            .catch(err =>
            {
                res.status(500).send({ message: 'Student not found' });
            })
    }
    else {
        const students = await student.find({ isVerified: false }).exec();
        if (!students) {
            res.status(200).send({ message: 'All students are verified' });
            return;
        }
        res.send(students);
    }
}

exports.postJobPage = async (req, res) =>
{
    const comp = await company.findById(req.id).exec();
    res.render('companyPostJob', { name: comp.companyName, message: "" });
}

exports.updateResumeHelper = async (req, res) =>
{
    const id = req.id;
    await student.find({ _id: id })
        .then((data) =>
        {
            // render to update student page ex. {/updateStudent/:id}
            res.render('studentUpdateResume', { student: data[0] });
        })
        .catch((err) =>
        {
            res
                .status(500)
                .render('error', { message: `Error retrieving user with email ${email}` });
        });
};

exports.hireStudent = async (req, res) =>
{
    const user = new studentPlaced({
        job: req.params.jobId,
        student: req.params.studentId,
    });
    console.log(req.params.studentId);
    await student.findByIdAndUpdate(req.params.studentId, { isPlaced: true }, { useFindAndModify: false })
        .then(async (data) =>
        {
            if (!data) {
                res.status(500).render('error', { message: 'Student not found' });
                return;
            }
            await user
                .save(user)
                .then((data) =>
                {
                    console.log("saved");
                    res.redirect(`/registredStudentsInJob/${req.params.jobId}`);
                })
                .catch((err) =>
                {
                    res.status(500).render('error', { message: err });
                });
        })
        .catch((err) =>
        {
            res.status(500).render('error', { message: 'Student not found' });
        });
};

exports.unhireStudent = async (req, res) =>
{
    await studentPlaced.findOneAndDelete({ job: req.params.jobId, student: req.params.studentId })
        .then(async (data) =>
        {
            if(!data)
            {
                res.status(500).render('error', { message: `Student not registered in job ${req.params.jobId}` });
                return;
            }
            await student.findByIdAndUpdate(req.params.studentId, { isPlaced: false }, { useFindAndModify: false })
                .then((data) =>
                {
                    res.redirect(`/registredStudentsInJob/${req.params.jobId}`);
                })
                .catch((err) =>
                {
                    res.status(500).render('error', { message: 'Student not found' });
                });
        })
        .catch((err) =>
        {
            res.status(500).render('error', { message: 'Student not found' });
        });
};
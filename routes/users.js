var express = require('express');
var router = express.Router();
var response = require('./../modules/response');
var bcrypt = require('bcryptjs')
var con = require('./../modules/mysqlConnection');

// Session

router.get('/', function (req, res, next) {
  if (req.session) {
    if (req.session.loggedUser) {
      response.getResponse(true, false, "Session-In", req.session.loggedUser.role);
      res.json(response.responseMessage())
      return;
    }
  }
  response.getResponse(false, true, "No-Session", null);
  res.json(response.responseMessage())
});


// Login Router

router.post('/login', function (req, res, next) {
  const { username, password } = req.body
  if (username.length < 1 || password.length < 1) {
    response.getResponse(false, true, "Please Fill All The Fields!", null);
    res.json(response.responseMessage())
    return;
  }
  con.query('SELECT * FROM users WHERE username =?', [username], function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", null);
      res.json(response.responseMessage())
      return;
    }
    if (result.length < 1) {
      response.getResponse(false, true, "Username Incorrect", null);
      res.json(response.responseMessage())
      return;
    }
    bcrypt.compare(password, result[0].password, function (error, user) {
      if (user) {
        req.session.loggedUser = result[0];
        response.getResponse(true, false, "User Logged Successfully", result[0].role);
        res.json(response.responseMessage())
        return;
      }
      response.getResponse(false, true, "Password Inccorect", null);
      res.json(response.responseMessage())
    })
  })
})


//Logout Router

router.post('/logout', function (req, res, next) {
  if (req.session) {
    if (req.session.loggedUser) {
      req.session.destroy();
      response.getResponse(true, false, "Session-Out", null);
      res.json(response.responseMessage())
      return;
    }
    else {
      response.getResponse(true, false, "Session-Already-Out", null);
      res.json(response.responseMessage())
      return;
    }
  }
})

// Register Router

router.put('/', function (req, res, next) {
  const { firstName, lastName, username, password } = req.body;
  if (firstName.length < 1 || lastName.length < 1 || username.length < 1 || password.length < 1) {
    response.getResponse(false, true, "Please Fill All The Fields!", null);
    res.json(response.responseMessage())
    return;
  }
  bcrypt.hash(password, 10, function (error, hash) {
    if (error) {
      response.getResponse(false, true, "Cant Hash The Password", null);
      res.json(response.responseMessage())
      return;
    }
    else {
      con.query('INSERT INTO users (first_name,last_name,username,password) VALUES(?,?,?,?)', [firstName, lastName, username, hash], function (error, result) {
        if (error) {
          response.getResponse(false, true, "username already exist, try another one", null);
          res.json(response.responseMessage())
          return;
        }
        con.query(`SELECT * FROM users WHERE username ='${username}'`, function (error, result) {
          if (error) {
            response.getResponse(false, true, "Error", null);
            res.json(response.responseMessage())
            return;
          }
          if (result.length < 1) {
            response.getResponse(false, true, "User not found", null);
            res.json(response.responseMessage())
            return;
          }
          req.session.loggedUser = result[0];
          response.getResponse(true, false, "User Addedd Successfully!", result[0].role);
          res.json(response.responseMessage())
          return;
        })
      })
    }
  })
})

// Adding Vacation Router

router.put('/vacation', function (req, res, next) {
  const { destination, description, price, startDate, endDate, image } = req.body;
  con.query(`INSERT INTO vacations (description,country,photo,start_date,end_date,price) VALUES(?,?,?,?,?,?)`, [description, destination, image, startDate, endDate, price], function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", error);
      res.json(response.responseMessage());
      return;
    }
    response.getResponse(true, false, "Vacation Added Successfully", result);
    res.json(response.responseMessage());
  })
})

// Get Vacation Router

router.get('/vacation', function (req, res, next) {
  con.query('SELECT id,description,country,photo,DATE_FORMAT(start_date,"%d-%m-%Y") as start_date,DATE_FORMAT(end_date,"%d-%m-%Y") as end_date,price,followers FROM vacations', function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", null);
      res.json(response.responseMessage());
      return;
    }
    response.getResponse(true, false, "Vacations List", result);
    res.json(response.responseMessage());
  })
})

// Get Vacations For Users

router.get('/uservacation', function (req, res, next) {
  con.query(`SELECT vacation_id FROM users_vacations WHERE user_id=${req.session.loggedUser.id}`, function (error, result1) {
    if (error) {
      response.getResponse(false, true, "Error", null);
      res.json(response.responseMessage());
      return;
    }
    if (result1.length < 1) {
      con.query('SELECT id,description,country,photo,DATE_FORMAT(start_date,"%d-%m-%Y") as start_date,DATE_FORMAT(end_date,"%d-%m-%Y") as end_date,price,followers FROM vacations', function (error, result) {
        if (error) {
          response.getResponse(false, true, "Error", null);
          res.json(response.responseMessage());
          return;
        }
        if (result.length < 1) {
          response.getResponse(false, true, "There Is No Vacations", null);
          res.json(response.responseMessage());
          return;
        }
        response.getResponse(true, false, "Vacations List Without Follow", result);
        res.json(response.responseMessage());
        return;
      })
    }
    else {
      con.query('SELECT id,description,country,photo,DATE_FORMAT(start_date,"%d-%m-%Y") as start_date,DATE_FORMAT(end_date,"%d-%m-%Y") as end_date,price,followers FROM vacations', function (error, result) {
        if (error) {
          response.getResponse(false, true, "Error", null);
          res.json(response.responseMessage());
          return;
        }
        for (let i = 0; i < result1.length; i++) {
          result1[i] = result1[i].vacation_id;
        }
        for (let x = 0; x < result.length; x++) {
          if (result1.includes(result[x].id)) {
            result[x].userFollow = true;
          }
        }
        result.sort(function (a, b) {
          return Object.keys(b).length - Object.keys(a).length;
        });
        response.getResponse(true, false, "Vacations List With Follow", result);
        res.json(response.responseMessage());
      })
    }
  })
})

// Get Followers Router

router.get('/followers', function (req, res, next) {
  con.query('SELECT * FROM vacations WHERE followers > 0', function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", null);
      res.json(response.responseMessage());
      return;
    }
    response.getResponse(true, false, "Followers List", result);
    res.json(response.responseMessage());
  })
})

// Delete Vacations

router.delete('/vacation', function (req, res, next) {
  const { id } = req.body;
  con.query(`DELETE FROM vacations WHERE id=${id}`, function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", error);
      res.json(response.responseMessage());
      return;
    }
    con.query(`DELETE FROM users_vacations WHERE vacation_id=${id}`, function (error, result) {
      if (error) {
        response.getResponse(false, true, "Error", error);
        res.json(response.responseMessage());
        return;
      }
      response.getResponse(true, false, "Vacation Deleted", result);
      res.json(response.responseMessage());
    })
  })
})

// Follow Vacation Router

router.post('/follow', function (req, res, next) {
  const { id } = req.body;
  con.query(`INSERT INTO users_vacations (user_id,vacation_id) VALUES(${req.session.loggedUser.id},${id})`, function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", error)
      res.json(response.responseMessage());
      return;
    }
    con.query(`UPDATE vacations SET followers=(SELECT COUNT(*) FROM users_vacations WHERE vacation_id=${id}) WHERE id=${id};`, function (error, result) {
      if (error) {
        response.getResponse(false, true, "Error", error)
        res.json(response.responseMessage());
        return;
      }
      response.getResponse(true, false, "Follow Added", result);
      res.json(response.responseMessage());
      return;
    })
  })
})

// Unfollow Vacation Router

router.post('/unfollow', function (req, res, next) {
  const { id } = req.body;
  con.query(`DELETE FROM users_vacations WHERE user_id=${req.session.loggedUser.id} and vacation_id=${id}`, function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", error)
      res.json(response.responseMessage());
      return;
    }
    con.query(`UPDATE vacations SET followers=(SELECT COUNT(*) FROM users_vacations WHERE vacation_id=${id}) WHERE id=${id};`, function (error, result) {
      if (error) {
        response.getResponse(false, true, "Error", error)
        res.json(response.responseMessage());
        return;
      }
      response.getResponse(true, false, "Follow Removed", result);
      res.json(response.responseMessage());
      return;
    })
  })
})

// Get Single Vacation For Modal Router

router.get('/getVacationDetails', function (req, res, next) {
  const { id } = req.body;
  con.query(`SELECT id,description,country,photo,DATE_FORMAT(start_date,"%d-%m-%Y") as start_date,DATE_FORMAT(end_date,"%d-%m-%Y") as end_date,price,followers FROM vacations WHERE id=${id}`, function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", error)
      res.json(response.responseMessage());
      return;
    }
    response.getResponse(true, false, "Vacation Details", result);
    res.json(response.responseMessage());
    return;
  })
})

// Edit Vacation Router

router.post('/editVacation', function (req, res, next) {
  const { id, destination, description, price, startDate, endDate, image } = req.body;
  con.query(`UPDATE vacations SET description='${description}', country='${destination}', photo='${image}', start_date='${startDate}', end_date='${endDate}', price='${price}' WHERE id=${id}`, function (error, result) {
    if (error) {
      response.getResponse(false, true, "Error", error)
      res.json(response.responseMessage());
      return;
    }
    response.getResponse(true, false, "Vacation updated", []);
    res.json(response.responseMessage());
    return;
  })
})

module.exports = router;
var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var mkdirp = require('mkdirp');
var fs = require('fs.extra');
var upload = multer();
var moment = require('moment');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var request = require('request');
var async = require('async');


router.post('/addTemplateField', function (req, res) {
    let post = req.body;
    req.getConnection(function (err, connection) {
      if (err) {
          res.json({
              status: false,
              message: err
          });
      } else {
          connection.query("SELECT * FROM template_field_master WHERE tfmFieldName = ? AND tfmTemplateId = ?", [post.tfmFieldName, post.tfmTemplateId], function (err, checkemail) {
              if (err) {
                  res.json({
                      status: false,
                      message: err
                  });
              } else {
                  if (checkemail.length === 0) {
                    var sql = "INSERT INTO template_field_master (tfmTemplateId, tfmBlockId, tfmField, tfmFieldName, tfmFieldValue, tfmFieldIsActive, tfmFieldIsDeleted, tfmFieldRequired, tfmFieldLength) VALUES ?";
                    var values = [
                        [post.tfmTemplateId, post.tfmBlockId, post.tfmField, post.tfmFieldName, post.tfmFieldValue, post.tfmFieldIsActive, 0, post.tfmFieldRequired, post.tfmFieldLength]
                    ];
                    connection.query(sql, [values], function (err, register) {
                        if (err) {
                            res.json({
                                status: false,
                                message: err
                            });
                        } else {
                            let fieldQuery = "ALTER TABLE " + post.tmpltName + " ADD COLUMN " + post.tfmFieldName.replace(" ","_").toLowerCase() + " " + setDataType(post.tfmField, post.tfmFieldLength)
                            connection.query(fieldQuery, function (err, register1) {
                                if (err) {
                                    res.json({
                                        status: false,
                                        message: err
                                    });
                                } else {
                                    res.json({
                                        data: register.tmpltId,
                                        status: true,
                                        message: "Field inserted successfully"
                                    });
                                }
                            })
                           
                        }
                    });
                  } else {
                    res.json({
                      status: false,
                      message: "Field Name is already Exists."
                    });
                  }   
              }
          });
      }
    });
});

router.post('/saveTemplateForm', function (req, res) {
    let post = req.body;
    req.getConnection(function (err, connection) {
        if (err) {
            res.json({
                status: false,
                message: err
            });
        } else {
            console.log("Fields", post.fields);
            var sql = "INSERT INTO " + post.tableName + "("+ post.fields +") VALUES ?";
            var values = [
                post.values
            ];
            connection.query(sql, [values], function (err, register) {
                if (err) {
                    console.log(err);
                    res.json({
                        status: false,
                        message: err
                    });
                } else {
                    res.json({
                        data: register.id,
                        status: true,
                        message: "Record inserted successfully"
                    });
                }
            });
        }
    });
});

router.get('/getTemplateBlock/:id', function (req, res) {
    req.getConnection(function (err, connection) {
        if (err) {
            res.json({
                status: 0,
                message: err
            });
        } else {
            const async = require('async');
            let templateFieldsRecords = [];
            var sql = "SELECT  * FROM template_block_master WHERE tbmTemplateId = ?";
            connection.query(sql, [req.params.id], function (err, rows) {
                if (err) {
                    res.json({
                        status: false,
                        message: err
                    });
                } else {
                    async.series([
                        function(callback){
                            if(rows.length > 0) {
                                async.eachSeries(rows, function(item, loopCb2){
                                    var sql = "SELECT * FROM template_field_master WHERE tfmTemplateId = ? AND tfmBlockId = ? ORDER BY tfmId ASC";
                                    connection.query(sql, [req.params.id, item.tbmId], function (err, rows) {
                                        if (err) {
                                            res.json({
                                                status: false,
                                                message: err
                                            });
                                        } else {
                                            rows.map(e => {
                                                e.tfmFieldDateAdded = moment(e.tfmFieldDateAdded, "YYYY-MM-DD HH:mm:ss").format('hh:mm a, MMM DD,YYYY');
                                                return e;
                                            });
                                            let temp = {
                                                tbmId: item.tbmId,
                                                tbmBlockName: item.tbmBlockName,
                                                templateFieldRecords: rows
                                            }
                                            templateFieldsRecords.push(temp);
                                            loopCb2(null,true);
                                        }
                                    });
                                },function(err,result){
                
                                        if(err){
                                           
                                        }
                
                                       callback(null,templateFieldsRecords);
                
                                });
                            }else{
                                
                                callback(null,templateFieldsRecords);
                            }
                            
                        }
                      ],
                      function(err,results){
                            if (err) {
                                res.json({
                                    status: false,
                                    message: err
                                });
                            }
                            //next();
                            res.json({
                                status: true,
                                message: "Success",
                                data: templateFieldsRecords
                            })
                      });
                    
                }
            });
        }
    });
});

router.post('/addTemplateBlock', function (req, res) {
    let post = req.body;
    req.getConnection(function (err, connection) {
        if (err) {
            res.json({
                status: false,
                message: err
            });
        } else {
            var sql = "INSERT INTO template_block_master (tbmTemplateId, tbmBlockName, tbmOrder) VALUES ?";
            var values = [
                [post.tbmTemplateId, post.tbmBlockName, post.tbmOrder]
            ];
            connection.query(sql, [values], function (err, register) {
                if (err) {
                    res.json({
                        status: false,
                        message: err
                    });
                } else {
                    res.json({
                        data: register.tmpltId,
                        status: true,
                        message: "Block inserted successfully"
                    });   
                }
            });
        }
    });
});

router.post('/addTemplate', function (req, res) {
  let post = req.body;
  req.getConnection(function (err, connection) {
    if (err) {
        res.json({
            status: false,
            message: err
        });
    } else {
        connection.query("SELECT * FROM template_master WHERE tmpltName = ?", [post.tmpltName], function (err, checkemail) {
            if (err) {
                res.json({
                    status: false,
                    message: err
                });
            } else {
                if (checkemail.length === 0) {
                    var sql = "INSERT INTO template_master (tmpltName, tmpltLayoutId, tmpltIsActive, tmpltIsDeleted) VALUES ?";
                    var values = [
                        [post.tmpltName, post.tmpltLayoutId, 1, 0]
                    ];
                    connection.query(sql, [values], function (err, register) {
                        if (err) {
                            res.json({
                                status: false,
                                message: err
                            });
                        } else {
                            let tblQuery = "CREATE TABLE " + post.tmpltName.replace(" ","_").toLowerCase() + "(id INT(10) AUTO_INCREMENT PRIMARY KEY, fieldOrder INT(10) NULL)";
                            connection.query(tblQuery, function (err, register1) {
                                if (err) {
                                    res.json({
                                        status: false,
                                        message: err
                                    });
                                } else {
                                    res.json({
                                        data: register.tmpltId,
                                        status: true,
                                        message: "Template inserted successfully"
                                    });
                                }
                            });
                            
                        }
                    });
                } else {
                  res.json({
                    status: false,
                    message: "Template Name is already Exists."
                  });
                }   
            }
        });
    }
  });
});

router.put('/updateFieldStatus/:id', function(req, res) {
    let id = req.params.id;
    let post = req.body;
    req.getConnection(function (err, connection) {
        if (err) {
            res.json({
                status: 0,
                message: err
            });
        } else {
            var sql = "UPDATE template_field_master SET tfmFieldIsActive = ? WHERE tfmId = ?";
            connection.query(sql, [post.tfmFieldIsActive, id], function (err, rows) {
                if (err) {
                    res.json({
                        status: false,
                        message: err
                    });
                } else {
                    res.json({
                        status: true,
                        message: "Field updated successfully.",
                    })
                }
            });
        }
    });
});

router.put('/updateTemplate/:id', function(req, res) {
    let id = req.params.id;
    let post = req.body;
    req.getConnection(function (err, connection) {
        if (err) {
            res.json({
                status: 0,
                message: err
            });
        } else {
            var sql = "UPDATE template_master SET tmpltName = ?, tmpltLayoutId = ? WHERE tmpltId = ?";
            connection.query(sql, [post.tmpltName, post.tmpltLayoutId, id], function (err, rows) {
                if (err) {
                    res.json({
                        status: false,
                        message: err
                    });
                } else {
                    res.json({
                        status: true,
                        message: "Template updated successfully.",
                    })
                }
            });
        }
    });
});

router.delete('/deleteTemplateField/:id', function (req, res) {
    let id = req.params.id;
    req.getConnection(function (err, connection) {
      if (err) {
          res.json({
              status: 0,
              message: err
          });
      } else {
        var sql = "DELETE FROM template_field_master WHERE tfmId = ?";
        connection.query(sql, [id], function (err, rows) {
            if (err) {
                res.json({
                    status: false,
                    message: err
                });
            } else {
                res.json({
                    status: true,
                    message: "Field deleted successfully.",
                })
            }
        });
      }
    });
});

router.delete('/deleteTemplate/:id', function (req, res) {
    let id = req.params.id;
    req.getConnection(function (err, connection) {
        if (err) {
            res.json({
                status: 0,
                message: err
            });
        } else {
            var sql = "DELETE FROM template_master WHERE tmpltId = ?";
            connection.query(sql, [id], function (err, rows) {
                if (err) {
                    res.json({
                        status: false,
                        message: err
                    });
                } else {
                    res.json({
                        status: true,
                        message: "Template deleted successfully.",
                    })
                }
            });
        }
    });
});

router.post('/getTemplateFieldsRecords', function (req, res) {
    let post = req.body;
    req.getConnection(function (err, connection) {
        if (err) {
            res.json({
                status: 0,
                message: err
            });
        } else {
            var sql = "SELECT * FROM " + post.tableName;
            connection.query(sql, function (err, rows) {
                if (err) {
                    res.json({
                        status: false,
                        message: err
                    });
                } else {
                    rows.map(e => {
                        e.dateUpdated = moment(e.dateUpdated, "YYYY-MM-DD HH:mm:ss").format('hh:mm a, MMM DD,YYYY');
                        return e;
                    });
                    res.json({
                        status: true,
                        message: "Success",
                        data: rows
                    })
                }
            });
        }
    });
});

router.get('/getTemplateRecord/:id', function (req, res) {
  let id = req.params.id;
  req.getConnection(function (err, connection) {
    if (err) {
        res.json({
            status: 0,
            message: err
        });
    } else {
      var sql = "SELECT * FROM template_master WHERE tmpltIsActive = 1 AND tmpltIsDeleted = 0 AND tmpltId = ?";
      connection.query(sql, [id], function (err, rows) {
          if (err) {
              res.json({
                  status: 404,
                  message: err
              });
          } else {
              rows.map(e => {
                  e.tmpltDateCreated = moment(e.tmpltDateCreated, "YYYY-MM-DD HH:mm:ss").format('hh:mm a, MMM DD,YYYY');
                  return e;
              });
              res.json({
                  status: 200,
                  message: "Success",
                  data: rows
              })
          }
      });
    }
  });
});


router.get('/getTemplateField/:id', function (req, res) {
    let id = req.params.id;
    req.getConnection(function (err, connection) {
        if (err) {
            res.json({
                status: 0,
                message: err
            });
        } else {
            
            var sql = "SELECT * FROM template_field_master WHERE tfmTemplateId = ? ORDER BY tfmId ASC";
            connection.query(sql, [id], function (err, rows) {
                if (err) {
                    res.json({
                        status: false,
                        message: err
                    });
                } else {
                    rows.map(e => {
                        e.tfmFieldDateAdded = moment(e.tfmFieldDateAdded, "YYYY-MM-DD HH:mm:ss").format('hh:mm a, MMM DD,YYYY');
                        return e;
                    });
                    res.json({
                        status: true,
                        message: "Success",
                        data: rows
                    })
                }
            });
        }
    });
  });

router.get('/getTemplates', function (req, res) {
  req.getConnection(function (err, connection) {
      if (err) {
          res.json({
              status: 0,
              message: err
          });
      } else {
          
          var sql = "SELECT t.*, (SELECT lytName FROM layout_master AS l where l.lytId = t.tmpltLayoutId) as layoutName FROM template_master AS t WHERE tmpltIsActive = 1 AND tmpltIsDeleted = 0 ORDER BY tmpltId ASC";
          connection.query(sql, function (err, rows) {
              if (err) {
                  res.json({
                      status: false,
                      message: err
                  });
              } else {
                  rows.map(e => {
                      e.tmpltDateCreated = moment(e.tmpltDateCreated, "YYYY-MM-DD HH:mm:ss").format('hh:mm a, MMM DD,YYYY');
                      return e;
                  });
                  res.json({
                      status: true,
                      message: "Success",
                      data: rows
                  })
              }
          });
      }
  });
});

router.get('/getLayoutRecords', function (req, res) {
  req.getConnection(function (err, connection) {
      if (err) {
          res.json({
              status: 0,
              message: err
          });
      } else {
          
          var sql = "SELECT * FROM layout_master WHERE lytIsActive = 1 AND lytIsDeleted = 0 ORDER BY lytId ASC";
          connection.query(sql, function (err, rows) {
              if (err) {
                  res.json({
                      status: false,
                      message: err
                  });
              } else {
                  rows.map(e => {
                      e.lytDateCreated = moment(e.lytDateCreated, "YYYY-MM-DD HH:mm:ss").format('hh:mm a, MMM DD,YYYY');
                      return e;
                  });
                  res.json({
                      status: true,
                      message: "Success",
                      data: rows
                  })
              }
          });
      }
  });
});

module.exports = router;

function setDataType(value, length) {
    if (value === 'url' || value === 'textbox' || value === 'text' || value === 'radio' || value === 'dropdown' || value === 'phone' || value === 'email' || value === 'date') {
        return 'VARCHAR('+ length +') NULL';
    } else if (value === 'integer') {
        return 'INT('+ length +') NULL';
    } else if (value === 'checkbox') {
        return 'BOOLEAN';
    } else {
        return 'TEXT';
    }
}
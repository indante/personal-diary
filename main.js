require('dotenv').config()
const express = require('express');
const hbs = require('express-handlebars');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// hbs 선언 및 설정
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');

// DB 선언 및 설정
var db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_DBNAME
});
db.connect();

app.get('/', (req, res) => {
    res.render('index', {
        message: req.query.message
    })
});

app.get('/diaryList', (req, res) => {
    if (req.cookies.session === undefined) {
        res.redirect(`/?message=${encodeURIComponent('다시 로그인 해주세요')}`)
    } else {
        db.query(`SELECT * FROM journals where user_id='${req.cookies.session}'`, (err, items) => {
            res.render('diaryList', {
                items: items
            })
        })
    }
})

// CSR 방식
// app.get('/diaryListJson', (req, res) => {
//     if (req.cookies.session === undefined) {
//         res.redirect(`/?message=${encodeURIComponent('다시 로그인 해주세요')}`)
//     } else {
//         db.query(`SELECT * FROM journals where user_id='${req.cookies.session}'`, (err, items) => {
//             res.json({ items })
//             // res.render('diaryList', {
//             //     items: items
//             // })
//         })
//     }
// })

app.get('/signUp', (req, res) => {
    res.render('signUp')
});

app.post('/signUp', (req, res) => {
    const { username, password } = req.body;
    db.query(`INSERT INTO users (username, password) VALUE('${username}', '${password}') `, (err, result) => {
        if (err) {
            res.send('아이디가 중복임')
        } else {
            res.redirect(`/?message=${encodeURIComponent('회원가입이 완료되었습니다. 로그인 해주세요.')}`)
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query(`SELECT * FROM users where username = '${username}' and password = '${password}'`, (err, result) => {
        if (result.length === 0) {
            res.redirect(`/?message=${encodeURIComponent('아이디 혹은 비밀번호를 확인해주세요')}`)
        } else {
            const user = result[0];
            res.cookie('session', user.id, { maxAge: 900000, httpOnly: true }); // 질문 내용
            res.redirect('/diaryList')
        }
    })
});

app.get('/journals/:id', (req, res) => {
    if (req.cookies.session === undefined) {
        res.redirect(`/?message=${encodeURIComponent('다시 로그인해주세요.')}`)
    } else {
        db.query(`SELECT * FROM journals where id = ${req.params.id}`, (err, result) => {
            res.render('journals', {
                result: result[0]
            });
        });
    }
});

app.get('/write', (req, res) => {
    res.render('write')
});

app.post('/write', (req, res) => {
    const { title, content } = req.body;
    db.query(`INSERT INTO journals(title, content, created_at, user_id) VALUE('${title}', '${content}', '${getCurrentDatetime()}', '${req.cookies.session}')`, (err, result) => {
        res.redirect(`/journals/${ result.insertId }`)
    })
});

app.get('/edit/:id', (req, res) => {
    db.query(`SELECT * FROM journals where id = ${req.params.id}`, (err, result) => {
        res.render('edit', {
            result: result[0]
        });
    });
});

app.post('/edit/:id', (req, res) => {
    if (req.cookies.session === undefined) {
        res.redirect(`/?message=${encodeURIComponent("로그인을 확인해주세요.")}`)
    } else {
        db.query(`UPDATE journals SET title = '${req.body.title}', content = '${req.body.content}', modified_at = '${getCurrentDatetime()}' WHERE id = ${req.params.id}`, (err, result) => {
            res.redirect(`/journals/${req.params.id}`)
        });
    }
});

app.post('/delete/:id', (req, res) => {
    db.query(`DELETE FROM journals WHERE id = ${req.params.id}`, (err, result) => {
        res.redirect('/diaryList')
    });
});

app.listen(3000, (req, res) => {
    console.log('Example app listening on port 3000!')
});



function getCurrentDatetime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');

}   
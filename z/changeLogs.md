# whats-in-my-mind

- [x] add better auth ui
- [x] todo belongs to one user
- [x] run lint check
- [x] remove all unused imports and code
- [x] dynamic breadcrumb
- [ ] not found component
- [ ] social
- [ ] send email
- [ ] verify email

Issues:  

I am on uq guest wifi  
prod schema can't be pushed using:
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require" bun run db:push

see the dev table using:
DATABASE_URL="your-production-url-here" bun run db:studio

then switched the .env url to be the prod now, then run:
bun run db:push

can't sign in: 503 Service Unavailable

ai can't figure out why

then using my own hotspot to sign in:
succeeded

now seeing 
[
    {
        "error": {
            "message": "DATABASE_URL environment variable is not set",
            "code": -32603,
            "data": {
                "code": "INTERNAL_SERVER_ERROR",
                "httpStatus": 500,
                "stack": "Error: DATABASE_URL environment variable is not set\n    at getDb (index.js:39564:11)\n    at Object.get (index.js:39578:12)\n    at index.js:73671:21\n    at resolveMiddleware (index.js:73514:26)\n    at callRecursive (index.js:73550:26)\n    at next (index.js:73556:16)\n    at index.js:73657:10\n    at callRecursive (index.js:73550:26)\n    at procedure (index.js:73576:26)\n    at index.js:25540:28",
                "path": "todo.getAll"
            }
        }
    }
]

## features

The features of this app are:
1. this app is designed to be one model but can be presented in different views - it means one row in the database can be presented differently in the UI. Some views, like table.tsx can display all the attributes of a row, where other views only display some attributes. 
2. if not signed in, some demo data will be loaded and the user can play around with it and the data not not stay. if signed in, user will be interacting with the database.
3. a task can be added from different views.
4. if a task is updated from one view, the updated task should be ready for all views. 
5. I may add other views in the future. 

can you identify places where code can be simplified - especially that I have some code repeats where I treat guest users and signed in users differently. 
also tell me other places things can be improved. is a state manager needed? is react hook form or formik needed? 



fixed by:
Fix can't get todo	613d160	tuokaikyle <kaituo@outlook.com>	18 Jan 2026 at 10:48 pm

when 100% pop up to confirm completed

modal add, edit

category management

add cypress

deadline -> due date

test view 1 and view 2

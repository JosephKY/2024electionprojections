const express = require("express");
const request = require("request-promise")
const app = express();


const states = [
    "alabama",
    "alaska",
    "arizona",
    "arkansas",
    "california",
    "colorado",
    "connecticut",
    "delaware",
    "district-of-columbia",
    "florida",
    "georgia",
    "hawaii",
    "idaho",
    "illinois",
    "indiana",
    "iowa",
    "kansas",
    "kentucky",
    "louisiana",
    "maine",
    "maryland",
    "massachusetts",
    "michigan",
    "minnesota",
    "mississippi",
    "missouri",
    "montana",
    "nebraska",
    "nevada",
    "new-hampshire",
    "new-jersey",
    "new-mexico",
    "new-york",
    "north-carolina",
    "north-dakota",
    "ohio",
    "oklahoma",
    "oregon",
    "pennsylvania",
    "rhode-island",
    "south-carolina",
    "south-dakota",
    "tennessee",
    "texas",
    "utah",
    "vermont",
    "virginia",
    "washington",
    "west-virginia",
    "wisconsin",
    "wyoming"
];

const fs = require("fs");
const path = require("path")
const polls =  JSON.parse(fs.readFileSync(path.join(__dirname, "polls.json")))

function getPollData(state){
    return new Promise((resolve, reject)=>{
        if(polls[state] && polls[state].ts && Date.now() - polls[state].ts < 86400000){
            console.log("using cache")
            resolve(polls[state]);
            return;
        } else {
            polls[state] = undefined;
        }

        function dataHandler(data, resolve, reject){
            try {
                data = JSON.parse(data);
                if(!Array.isArray(data)){
                    reject(new Error("Invalid data: master is not an array"))
                    return;
                }
                let poll = data[data.length - 1]
                if(!poll || !poll.answers){
                    reject(new Error("Invalid data: poll not found"))
                    return;
                }
                let answers = poll.answers;
                if(!answers || !Array.isArray(answers)){
                    reject(new Error("Invalid data: answers not found"))
                    return;
                }
                let ret = {
                    ts: Date.now(),
                    name: state
                };
                answers.forEach(answer=>{
                    if(ret[answer.party] && parseFloat(ret[answer.party].pct) > parseFloat(answer.pct))return;
                    ret[answer.party] = answer;
                })
                polls[state] = ret;
                fs.writeFileSync("polls.json", JSON.stringify(polls));
                resolve(ret);
            } catch(e) {
                console.log('2')
                reject([e, state]);
            }
        }

        request(`https://projects.fivethirtyeight.com/polls/president-general/2024/${state}/polls.json`)
        .then(data=>{
            dataHandler(data, resolve, reject)
        })
        .catch(e=>{
            request(`https://projects.fivethirtyeight.com/polls/president-general/2020/${state}/polls.json`)
            .then(data=>{
                dataHandler(data, resolve, reject)
            })
            .catch(e=>{
                reject([e, state]);
            })
        })
    })
}

app.set("view engine", "ejs");
app.set("views", "views");

app.get("/", (req, res) => {
    let promises = [];
    states.forEach(state=>{
        promises.push(getPollData(state))
    })
    Promise.all(promises)
    .then(data=>{
        console.log("here")
        res.render("polls", {polls: data})
    })
    .catch(e=>{
        console.log("u")
        res.json({error: e.message});
    })
});

app.listen(2024);
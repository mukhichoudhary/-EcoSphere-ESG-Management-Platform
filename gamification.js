// ==========================================
// GAMIFICATION MODULE - JAVASCRIPT
// ==========================================


// ==============================
// XP GROWTH CHART
// ==============================
if(localStorage.getItem("isLoggedIn") !== "true"){

    window.location.href = "login.html";

}
const xpChart = document.getElementById("xpChart");

if (xpChart) {

    new Chart(xpChart, {

        type: "bar",

        data: {

            labels: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun"
            ],

            datasets: [{

                label: "XP Earned",

                data: [1200, 1800, 2200, 3100, 3700, 4250],

                backgroundColor: [
                    "#8b5cf6",
                    "#7c3aed",
                    "#6d28d9",
                    "#9333ea",
                    "#a855f7",
                    "#c084fc"
                ],

                borderRadius: 8

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: true

                }

            }

        }

    });

}



// ==============================
// REWARD BUTTON
// ==============================

const rewardBtn = document.querySelector(".reward-btn");

if(rewardBtn){

    rewardBtn.addEventListener("click",()=>{

        alert("🎉 Congratulations!\n\nReward Claimed Successfully.");

    });

}



// ==============================
// CARD HOVER EFFECT
// ==============================

const cards=document.querySelectorAll(".card");

cards.forEach(card=>{

    card.addEventListener("mouseenter",()=>{

        card.style.transform="translateY(-10px)";
        card.style.transition=".3s";

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="translateY(0px)";

    });

});




// ==============================
// TABLE HOVER
// ==============================

const rows=document.querySelectorAll("table tr");

rows.forEach((row,index)=>{

    if(index!==0){

        row.addEventListener("mouseenter",()=>{

            row.style.background="#f3e8ff";

        });

        row.addEventListener("mouseleave",()=>{

            row.style.background="white";

        });

    }

});




// ==============================
// PROGRESS BAR ANIMATION
// ==============================

const progress=document.querySelector("progress");

if(progress){

    let target=78;

    let value=0;

    progress.value=0;

    const interval=setInterval(()=>{

        value++;

        progress.value=value;

        if(value>=target){

            clearInterval(interval);

        }

    },25);

}




// ==============================
// COUNTER ANIMATION
// ==============================

const counters=document.querySelectorAll(".card h2");

counters.forEach(counter=>{

    counter.style.opacity="0";

    setTimeout(()=>{

        counter.style.opacity="1";
        counter.style.transition="1s";

    },500);

});




// ==============================
// SIDEBAR ACTIVE
// ==============================

const menu=document.querySelectorAll(".sidebar ul li");

menu.forEach(item=>{

    item.addEventListener("click",()=>{

        menu.forEach(i=>{

            i.classList.remove("active");

        });

        item.classList.add("active");

    });

});




// ==============================
// PAGE LOAD
// ==============================

window.onload=function(){

    console.log("Gamification Module Loaded Successfully");

};




// ==============================
// LEVEL CHECK
// ==============================

const xp=4250;

if(xp>=4000){

    console.log("🏆 Level 9 Achieved");

}
else{

    console.log("Keep Earning XP!");

}




// ==============================
// LEADERBOARD MESSAGE
// ==============================

setTimeout(()=>{

    console.log("🥈 You are currently Rank #2");

},2000);




// ==============================
// REWARD NOTIFICATION
// ==============================

setTimeout(()=>{

    console.log("🎁 New Reward Unlocked!");

},4000);




// ==============================
// SCROLL EVENT
// ==============================

window.addEventListener("scroll",()=>{

    if(window.scrollY>300){

        console.log("Scrolling...");

    }

});
// ================================
// ENVIRONMENTAL CHART
// ================================
if(localStorage.getItem("isLoggedIn") !== "true"){

    window.location.href = "login.html";

}
const ctx = document.getElementById("environmentChart");

if (ctx) {

    new Chart(ctx, {

        type: "line",

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

                label: "Carbon Emission (Tons)",

                data: [240, 220, 205, 195, 180, 165],

                borderColor: "#16a34a",

                backgroundColor: "rgba(34,197,94,0.2)",

                fill: true,

                tension: 0.4

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


// ================================
// ADD CARBON RECORD BUTTON
// ================================

const addBtn = document.querySelector(".add-btn");

if(addBtn){

    addBtn.addEventListener("click",()=>{

        alert("New Carbon Record feature will be connected with Backend.");

    });

}



// ================================
// CARD ANIMATION
// ================================

const cards=document.querySelectorAll(".card");

cards.forEach(card=>{

    card.addEventListener("mouseenter",()=>{

        card.style.transform="translateY(-8px)";

        card.style.transition="0.3s";

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="translateY(0px)";

    });

});




// ================================
// TABLE ROW HOVER
// ================================

const rows=document.querySelectorAll("table tr");

rows.forEach((row,index)=>{

    if(index!==0){

        row.addEventListener("mouseenter",()=>{

            row.style.background="#dcfce7";

        });

        row.addEventListener("mouseleave",()=>{

            row.style.background="white";

        });

    }

});




// ================================
// PROGRESS BAR ANIMATION
// ================================

const progress=document.querySelectorAll("progress");

progress.forEach(bar=>{

    let value=0;

    let target=bar.value;

    bar.value=0;

    let interval=setInterval(()=>{

        if(value>=target){

            clearInterval(interval);

        }
        else{

            value++;

            bar.value=value;

        }

    },20);

});




// ================================
// SIDEBAR ACTIVE MENU
// ================================

const menuItems=document.querySelectorAll(".sidebar ul li");

menuItems.forEach(item=>{

    item.addEventListener("click",()=>{

        menuItems.forEach(menu=>{

            menu.classList.remove("active");

        });

        item.classList.add("active");

    });

});




// ================================
// PAGE LOAD MESSAGE
// ================================

window.onload=function(){

    console.log("Environmental Module Loaded Successfully");

};
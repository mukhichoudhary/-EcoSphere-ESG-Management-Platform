// ======================================
// GOVERNANCE CHART
// ======================================
if(localStorage.getItem("isLoggedIn") !== "true"){

    window.location.href = "login.html";

}
const governanceChart = document.getElementById("governanceChart");

if (governanceChart) {

    new Chart(governanceChart, {

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

                label: "Compliance Score",

                data: [72, 76, 80, 84, 90, 95],

                borderColor: "#f59e0b",

                backgroundColor: "rgba(245,158,11,0.2)",

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



// ======================================
// ADD AUDIT BUTTON
// ======================================

const addBtn = document.querySelector(".add-btn");

if(addBtn){

    addBtn.addEventListener("click",()=>{

        alert("New Audit will be added after Backend Integration.");

    });

}



// ======================================
// CARD ANIMATION
// ======================================

const cards=document.querySelectorAll(".card");

cards.forEach(card=>{

    card.addEventListener("mouseenter",()=>{

        card.style.transform="translateY(-8px)";
        card.style.transition=".3s";

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="translateY(0px)";

    });

});



// ======================================
// TABLE ROW HOVER
// ======================================

const rows=document.querySelectorAll("table tr");

rows.forEach((row,index)=>{

    if(index!==0){

        row.addEventListener("mouseenter",()=>{

            row.style.background="#fef3c7";

        });

        row.addEventListener("mouseleave",()=>{

            row.style.background="white";

        });

    }

});



// ======================================
// SIDEBAR ACTIVE MENU
// ======================================

const menu=document.querySelectorAll(".sidebar ul li");

menu.forEach(item=>{

    item.addEventListener("click",()=>{

        menu.forEach(i=>{

            i.classList.remove("active");

        });

        item.classList.add("active");

    });

});



// ======================================
// CARD COUNTER ANIMATION
// ======================================

const numbers=document.querySelectorAll(".card h2");

numbers.forEach(number=>{

    number.style.opacity="0";

    setTimeout(()=>{

        number.style.opacity="1";
        number.style.transition="1s";

    },500);

});



// ======================================
// PAGE LOAD MESSAGE
// ======================================

window.onload=function(){

    console.log("Governance Module Loaded Successfully");

};



// ======================================
// COMPLIANCE ALERT
// ======================================

setTimeout(()=>{

    console.log("Reminder: 4 Compliance Issues Pending.");

},3000);



// ======================================
// POLICY STATUS COLORS
// ======================================

const statusCells=document.querySelectorAll("table td:last-child");

statusCells.forEach(cell=>{

    const text=cell.innerText.toLowerCase();

    if(text.includes("active")){

        cell.style.color="green";
        cell.style.fontWeight="bold";

    }

    else if(text.includes("approved")){

        cell.style.color="blue";
        cell.style.fontWeight="bold";

    }

    else if(text.includes("review")){

        cell.style.color="orange";
        cell.style.fontWeight="bold";

    }

});



// ======================================
// SCROLL TO TOP
// ======================================

window.addEventListener("scroll",()=>{

    if(window.scrollY>300){

        console.log("Scrolling...");

    }

});
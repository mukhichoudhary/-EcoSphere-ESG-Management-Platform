// ======================================
// SOCIAL CHART
// ======================================

const socialChart = document.getElementById("socialChart");

if (socialChart) {

    new Chart(socialChart, {

        type: "bar",

        data: {

            labels: [
                "HR",
                "IT",
                "Sales",
                "Finance",
                "Production"
            ],

            datasets: [{

                label: "Employee Participation (%)",

                data: [92, 84, 76, 88, 81],

                backgroundColor: [
                    "#2563eb",
                    "#3b82f6",
                    "#60a5fa",
                    "#93c5fd",
                    "#bfdbfe"
                ]

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
// ADD CSR ACTIVITY BUTTON
// ======================================

const addBtn = document.querySelector(".add-btn");

if(addBtn){

    addBtn.addEventListener("click",()=>{

        alert("New CSR Activity feature will be connected with Backend.");

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

            row.style.background="#dbeafe";

        });

        row.addEventListener("mouseleave",()=>{

            row.style.background="white";

        });

    }

});




// ======================================
// ACTIVE SIDEBAR
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
// PAGE LOAD
// ======================================

window.onload=function(){

    console.log("Social Module Loaded Successfully");

};




// ======================================
// CARD COUNTER ANIMATION
// ======================================

const numbers=document.querySelectorAll(".card h2");

numbers.forEach(num=>{

    num.style.opacity="0";

    setTimeout(()=>{

        num.style.opacity="1";
        num.style.transition="1s";

    },500);

});
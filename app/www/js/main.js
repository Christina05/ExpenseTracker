var request = new XMLHttpRequest();
var userId=0;
$(window).ready(function(){
    //currency options
    request.open("GET","https://openexchangerates.org/api/currencies.json",true);
    request.onreadystatechange=addCurrency;
    request.send();

    $("#signinBtn").on("click", signIn);
    $("#loginBtn").on("click", logIn);
    $(document).on('click', '#logOut', logOutUser);

    //new expense
    $("#saveExpenseBtn").on("click", addNewExpense);
    $("#listAllExpensesBtn").on("click", loadData);
    $(document).on('click', '.deleteExpense', deleteSelectedExpense);
});

document.addEventListener("deviceready",function(){
    //ovo sad triba
    $("#newExpensePicBtn").click(takePicture);
    
});

function signIn(){
    var userName=$("#newUserNameInput").val();
    var userEMail= $("#newUserMailInput").val();
    var userPassword= $("#newUserPasswordInput").val();

    if(userName == "" || userEMail=="" || userPassword=="" ){
        alert("Please fill all fields!")
    }
    else{
        request.onreadystatechange=signedInUser;
        request.open('put',"http:\\192.168.209.58:4000/signIn?name="+userName+"&mail="+userEMail+"&password="+userPassword,true);
        request.send();
    }
};

function signedInUser(){
    if(request.status==200 && request.readyState==4)
    {
        var response= request.responseText;
        if(response=="false"){
            alert("Wrong e-mail or password");
        }
        else
        {
            $("#newUserNameInput").val("");
            $("#newUserMailInput").val("");
            $("#newUserPasswordInput").val("");
            $("#userMailInput").val("");
            $("#userPasswordInput").val("");
            response= response.split(',');
            userId=response[0];
            var newHeader= `<div data-role="controlgroup" class="ui-btn-right">
                                <span id='userName'>`+ response[1] + `</span> (<a id='logOut'>Log out</a>)
                            </div>`;
            $(".header").html(newHeader);
            window.location.replace("#mainPage");
        }
    }
};

function logIn(){
    var userEMail= $("#userMailInput").val();
    var userPassword= $("#userPasswordInput").val();
    if(userEMail=="" || userPassword=="" ){
        alert("Please enter email and password!")
    }
    else{
        request.onreadystatechange=signedInUser;
        request.open('get',"http:\\192.168.209.58:4000/login?mail="+userEMail+"&password="+userPassword,true);
        request.send();
    }
};



function logOutUser(){
    alert("aa!");
    var newHeader=`<div data-role="controlgroup" class="ui-btn-right">
                    <a href="#loginPage"><button>Log in</button></a>
                    <a href="#signinPage"><button>Sign in</button></a>
                    </div>`;
    $(".header").html(newHeader);
    userId=0;
    window.location.replace("#beforeLogin");
};

//new expense
function addNewExpense(){
    var date=$("#dateInput").val();
    var name=$("#nameInput").val();
    var value=$("#valueInput").val();
    var currency=$("#currencyInput").val();
    if(value=="" || value==null){
        alert("Please enter value!");
        return;
    }
    if(name=="" || name==null){
        name="Undefined";
    }
    value=value+currency;

    request.onreadystatechange=saveData;
    request.open('put',"http:\\192.168.209.58:4000/save?userId="+userId+"&date="+date+"&name="+name+"&value="+value,true);
    request.send();
}

function saveData(){
    if(request.readyState==4 && request.status==200){
        var response=request.responseText;
        window.location.replace("#mainPage");
        $("#message").html(response);
    }
}

function loadData(){
    //prvo izbriši staro
    request.onreadystatechange=showData;
    request.open('get',"http:\\192.168.209.58:4000/loadData?userId="+userId,true);
    request.send();
}

function showData(){
    //dodat brisanje 
    if(request.readyState==4 && request.status==200){
        var response=request.responseText;
        var listOfExpenses= response.split("\n"); //split by line
        var table="<table class='table table-bordered'><th>Date</th><th>Name</th><th>Value</th>";
        for(var i=1;i<listOfExpenses.length - 1;i++){
            var oneExpense=listOfExpenses[i].split(",");
            table+=`<tr><td>`+oneExpense[0]+`</td><td>`+oneExpense[1]+`</td><td>`+oneExpense[2]+`</td>
                        <td><a class="deleteExpense" role="button" id="`+i+`">Delete</a></td></tr>`;
        }
        table+="</table>";
        $("#listOfExpenses").html("");

        $("#listOfExpenses").html(table);
        //ok sammo prilagodi izgled
        
    }
}

function deleteSelectedExpense(){
    var selected=this.id;
    request.open("GET", "http:\\192.168.209.58:4000/deleteExpense?selected="+selected+"&userId="+userId,true);
    request.onreadystatechange=showData;
    request.send();
}

function takePicture(){
    window.location.replace("#newExpensePage");
    //dodaj please wait
    var options={
        quality: 80,
        destinationType: Camera.DestinationType.DATA_URL,//DATA_URL,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        correctOrientation: true,
        cameraDirection: 1,
        allowEdit: true
       
    }
    navigator.camera.getPicture(success,fail,options);
    
}


//ako uspije slikat odma šalje sliku na server
function success(img){
    var blob = b64toBlob(img); //pretvara sliku u blob da ga može poslat kao file

    var formData=new FormData();
    formData.name="myFile";
    formData.append("myFile",blob);
    
    request.open("POST", "http:\\192.168.209.58:4000/upload",true);
    request.onreadystatechange=newExpenseFromImage;
    request.send(formData);
    
}

//ako dođe do greške pri slikavanju
function fail(e){
    alert(e);
}


function newExpenseFromImage(){
    if(request.status==200 && request.readyState==4){
        var response=request.responseText.split(',');
        window.location.replace("#newExpensePage");
        alert("Please check inputs!");
        $("#nameInput").val(response[0]);
        $("#dateInput").val(response[1]);
        $("#valueInput").val(parseFloat(response[2]));

    }
}
//pretvaranje slike
function b64toBlob(dataURI) {
    var dataurl="data:image/png;base64,"+dataURI
    var byteString = atob(dataurl.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);

    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
}

function addCurrency(){
    var input= $("#currencyInput");
    
    if(request.status==200 && request.readyState==4){
        var currencyList=JSON.parse(request.responseText);
        var currency=Object.keys(currencyList);
        for (var i in currency){
            if(currency[i]=="HRK"){
                input.append("<option selected value="+currency[i]+">"+currency[i]+"</option");
            }
            else{
                input.append("<option value="+currency[i]+">"+currency[i]+"</option");  
            }
        }
    }
}


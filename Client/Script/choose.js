$(document).ready(function(){ 
  //Load data
  var requestUrl = settings.quizAPIurl + settings.apiListResource;
  $.getJSON(requestUrl, function(data) {
    // Create options 
    var listitems = '';
    $.each(data.quiz, function(index, value){
        listitems += '<option value=' + value.id + '>' + value.title + '</option>';
    });
    $('#QuizSelector').html(listitems);
  });
  
  // Click handler
  $('#StartQuiz').first().click(function(){
    var value = $( "#QuizSelector" ).val();
    window.location = settings.quizUrl + value;
  });
});


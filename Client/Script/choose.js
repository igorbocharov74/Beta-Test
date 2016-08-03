$(document).ready(function(){
  // Create options  
  var listitems = '';
  $.each(d.quiz, function(index, value){
      listitems += '<option value=' + value.id + '>' + value.title + '</option>';
  });
  $('#QuizSelector').html(listitems);
  
  // Click handler
  $('#StartQuiz').first().click(function(){
    var value = $( "#QuizSelector" ).val();
    window.location = settings.quizUrl + value;
  }
  );
});


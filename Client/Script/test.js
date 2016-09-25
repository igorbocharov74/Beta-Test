// Constants
var TICKETS_IN_ROW = 10;

// Data
var storage = {};

// Document Events
$(document).ready(function(){
  //Load data, create model
  var id = window.location.search.replace("?id=", ''); 
  var requestUrl = settings.quizAPIurl + settings.apiQuizResource + '/' + id;
  $.getJSON(requestUrl, function(data) {
    var vm = new QuizViewModel(data);
    ko.applyBindings(vm);
  });
});

// Models

// Answer
function AnswerViewModel(answer) {
  var self = this;
  self.text = answer.text;
  self.id = answer.value;
  self.selected = ko.observable(false);
  self.canBeHidden = "canBeHidden" in answer ? answer.canBeHidden : false;
  self.aVisible = ko.observable(true); // Current state of visibility
  return self;
};

// Ticket
function TicketViewModel(ticket) {
  var self = this;
  self.id = ticket.id;
  self.question = ticket.question;
  self.allow50 = ko.observable(ticket.allow50);
  self.answers = [];
  for (var i = 0; i < ticket.answers.length; i++) {
      self.answers.push(new AnswerViewModel(ticket.answers[i]));
  }
  
  self.questionSigned = ko.observable(false); // Current state of question sign
  self.applied50 = ko.observable(false);  // Current state of tip

  return self;
};

// Quiz
function QuizViewModel(data) {
    var self = this;
    
    self.InitTickets = function(){
      for (var i = 0; i < data.quiz.tickets.length; i++) {
        self.tickets.push(new TicketViewModel(data.quiz.tickets[i]));
      }
    };
    
    //Settings
    self.settings = data.quiz.settings;
    
    self.tickets_in_row = TICKETS_IN_ROW;
    
    // Questions
    self.correctAnswers = data.quiz.correctAnswers;
    
    self.tickets = ko.observableArray([]);
    self.InitTickets();

    self.currentTicketId = ko.observable(0);
    self.currentTicketIdNormalized = ko.computed(function(){return self.currentTicketId() + 1;});
    self.currentTicket = ko.computed(function(){return self.tickets()[self.currentTicketId()];});
    // Current state of question sign for current ticket
    self.questionSignVisible = ko.computed(function(){return self.currentTicket().questionSigned();});
    // Current state of tip ability for current ticket
    self.button50Visible = ko.computed(function(){return self.currentTicket().allow50();});
    // Current state of tip for current ticket
    self.sign50Visible = ko.computed(function(){return self.currentTicket().applied50();});
    
    self.onQuestionSignButtonClick = function(){
      self.currentTicket().questionSigned(!self.questionSignVisible())
    }
    
    self.onButton50Click = function(){
      var newApplied50 = !self.currentTicket().applied50();
      self.currentTicket().applied50(newApplied50);
      
      self.currentTicket().answers.forEach(function(a) {
        a.selected(false);
        if (a.canBeHidden && newApplied50){
          a.aVisible(false);
        } else {
          a.aVisible(true);
        }
      });
    }
    
    // Previos, Next buttons
    self.onNextButtonClick = function(){
      var newId = self.currentTicketId() + 1;
      if (newId <= self.tickets().length - 1){
        self.currentTicketId(newId);
        if (newId === 1){
          self.prevButtonEnable(true);
        };
      } else {
        self.nextButtonEnable(false);
      }
    };
    self.onPrevButtonClick = function(){
      var newId = self.currentTicketId() - 1;
      if (newId >= 0){
        self.currentTicketId(newId);
        if (newId === self.tickets().length-2){
          self.nextButtonEnable(true);
        }
      } else{
        self.prevButtonEnable(false);
      }
    };
    self.prevButtonEnable = ko.observable(false);
    self.nextButtonEnable = ko.observable(true);
    
    self.onTicketThumbClick = function(id){
      self.currentTicketId(id);
    }
    
    self.onEndQuizButtonClick = function(){
      self.EndQuiz();
    };
    
    self.newRow = function(index){
     return index % self.tickets_in_row === 0 && index > 0
    };
    
    // Timer
    self.remainingMin = ko.observable(self.settings.timeLimit.min);
    self.remainingMinFormatted = ko.computed(
      function(){
        return (self.remainingMin() < 10) ? "0" + self.remainingMin() : self.remainingMin();
      }
    );
    self.remainingSec = ko.observable(self.settings.timeLimit.sec);
    self.remainingSecFormatted = ko.computed(
      function(){
        return (self.remainingSec() < 10) ? "0" + self.remainingSec() : self.remainingSec();
      }
    );
    self.isTimerRunning = ko.observable(false);
    
    self.StartTimer = function(){
      self.isTimerRunning(true);
      self.timerId = window.setInterval(function(){
        var min = self.remainingMin();
        var sec = self.remainingSec();
        if (sec === 0) {
          if (min === 0) {
            clearInterval(self.timerId);
            self.isTimerRunning(false);
            self.onTimeOver();
            return;
          }
          self.remainingMin(--min);
          self.remainingSec(59);
        }
        else self.remainingSec(--sec);
      }, 1000)
    };
    
    self.onTimeOver = function(){
      self.EndQuiz();
    };
    
    self.EndQuiz = function(){
      var ticketIndex, answerIndex;
            
      if (self.isTimerRunning()){
        clearInterval(self.timerId);
      }

      var results = {};
      results.name = storage.Name;
      results.settings = self.settings;
      results.tickets = [];
      
      // Process results
      for (ticketIndex = 0; ticketIndex < self.tickets().length; ticketIndex++) {
        // Answer cases
        var ticketAnswers = self.tickets()[ticketIndex].answers;
        // Current ticket ID
        var ticketId = self.tickets()[ticketIndex].id;
        // Correct answer item for current ticket ID
        var correctAnswer = self.correctAnswers.filter(function (entry) { return entry.id === ticketId; })[0];

        var revisedAnswers = [];
        for (answerIndex = 0; answerIndex < ticketAnswers.length; answerIndex++) {        
          if (ticketAnswers[answerIndex].selected()){
            // Check if current answer is present in correct answers
            // TODO: replace answerIndex with answer.value
            var currentIndexCorrect = correctAnswer.correct.filter(function (entry) { return entry === answerIndex + 1; }).length > 0;
            revisedAnswers.push({id : answerIndex + 1, correct : currentIndexCorrect})
          }
        }
        
        var ticketResult = {
          id : self.tickets()[ticketIndex].id,
          answers : revisedAnswers
        };
        results.tickets.push(ticketResult);
      }

      // TODO: calculate percentage of the the correct answers
      
      // Send results to Server
      var postUrl = settings.quizAPIurl + settings.apiResultResource;
       $.ajax({
         url: postUrl,
         type: 'POST',
         contentType:'application/json',
         data: JSON.stringify(results),
         dataType:'json'
       });
    };
    
    // Init
    
    self.Init = function(){
       //Start timer
       self.StartTimer();
       
       //TODO: implement input pupil's name and form before start quiz
       storage.Name = 'bocharov';
    }

    self.Init();
    
    return self;
};

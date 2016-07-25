$(document).ready(function(){
  ko.applyBindings(new QuizViewModel(d));
});

function AnswerViewModel(answer) {
  var self = this;
  self.answer = answer;
  self.selected = ko.observable(false);
  return self;
};
  
function TicketViewModel(question, answers) {
  var self = this;
  self.question = question;
  self.answers = [];
  for (var i = 0; i < answers.length; i++) {
      self.answers.push(new AnswerViewModel(answers[i]));
  }
  
  //TODO: fix logic
  self.select = function(answer) {
      self.answers.forEach(function(a) { a.selected(false); });
      answer.selected(true);
  }
  return self;
};

function QuizViewModel(data) {
    var self = this;
    
    self.settings = data.quiz.settings;
    
    // Questions
    self.correctAnswers = data.quiz.correctAnswers;
    
    self.tickets = ko.observableArray(data.quiz.tickets);
    self.currentTicketId = ko.observable(0);
    self.currentTicketIdNormalized = ko.computed(function(){return self.currentTicketId() + 1;});
    self.currentTicket = ko.computed(function(){return self.tickets()[self.currentTicketId()];});

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
    
    self.onTimeOver = function(){alert("That's all!");};
    self.Init = function(){
       //Start timer
       self.StartTimer();
    }

    self.Init();
    
    return self;
};

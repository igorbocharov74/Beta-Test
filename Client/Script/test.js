<!--Constants-->
var TICKETS_IN_ROW = 10;

<!--Document Events-->
$(document).ready(function(){
  var vm = new QuizViewModel(d);
  ko.applyBindings(vm);
});

<!--Models-->
function AnswerViewModel(answer) {
  var self = this;
  self.text = answer.text;
  self.selected = ko.observable(false);
  self.id = answer.id;
  self.canBeHidden = "canBeHidden" in answer ? answer.canBeHidden : false;
  self.aVisible = ko.observable(true);
  return self;
};
  
function TicketViewModel(ticket) {
  var self = this;
  self.question = ticket.question;
  self.questionSigned = ko.observable(false);
  self.applied50 = ko.observable(false);
  self.allow50 = ko.observable(ticket.allow50);
  self.answers = [];
  for (var i = 0; i < ticket.answers.length; i++) {
      self.answers.push(new AnswerViewModel(ticket.answers[i]));
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
    
    self.InitTickets = function(){
      for (var i = 0; i < data.quiz.tickets.length; i++) {
        self.tickets.push(new TicketViewModel(data.quiz.tickets[i]));
      }
    };
    
    //Settings
    self.settings = data.quiz.settings;
    
    // Questions
    self.correctAnswers = data.quiz.correctAnswers;
    
    self.tickets = ko.observableArray([]);
    self.InitTickets();

    self.currentTicketId = ko.observable(0);
    self.currentTicketIdNormalized = ko.computed(function(){return self.currentTicketId() + 1;});
    self.currentTicket = ko.computed(function(){return self.tickets()[self.currentTicketId()];});
    
    self.questionSignVisible = ko.computed(function(){return self.currentTicket().questionSigned();});
    self.button50Visible = ko.computed(function(){return self.currentTicket().allow50();});
    self.sign50Visible = ko.computed(function(){return self.currentTicket().applied50();});;
    
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
      if (self.isTimerRunning()){
        clearInterval(self.timerId);
      }

      alert("That's all!");
    };
    
    // Init
    
    self.Init = function(){
      var $templates = $("#templates").children();
      var $parent = $(".row.pages").children().first();
      var $clonedNode;
      
      for (var i = 0; i < self.tickets().length; i++) {
        if (i % TICKETS_IN_ROW === 0 && i > 0){
          $clonedNode = $($templates[1]).clone();
          $clonedNode.appendTo($parent);
        }
        $clonedNode = $($templates[0]).clone();
        $($clonedNode).attr("data-bind", "click: function(){onTicketThumbClick(" + i + ");}");
        $span = $($clonedNode).find("span");
        $span.attr("data-bind", "css: { marked: tickets()[" + i + "].questionSigned()}")
        $span.text(i+1);
        $clonedNode.appendTo($parent);
      }
       //Start timer
       self.StartTimer();
    }

    self.Init();
    
    return self;
};

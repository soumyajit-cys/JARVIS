const aiService = require('../services/aiService');
const commandHandler = require('../services/commandHandler');
const noteReminderService = require('../services/noteReminderService');

class ChatController {
  async processMessage(req, res) {
    try {
      const { message } = req.body;
      
      if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      // Initialize session stores if not exists
      if (!req.session.notes) req.session.notes = [];
      if (!req.session.reminders) req.session.reminders = [];
      if (!req.session.conversationHistory) req.session.conversationHistory = [];

      // Add user message to history
      req.session.conversationHistory.push({ role: 'user', content: message });
      
      // Trim conversation history to last 10 messages for context
      if (req.session.conversationHistory.length > 10) {
        req.session.conversationHistory = req.session.conversationHistory.slice(-10);
      }

      // Check for due reminders and add notification
      const dueReminders = noteReminderService.checkDueReminders(req.session.reminders);
      let reminderNotification = '';
      if (dueReminders.length > 0) {
        reminderNotification = `⚠️ Reminder${dueReminders.length > 1 ? 's' : ''}: ${dueReminders.map(r => r.task).join(', ')}. `;
        // Remove due reminders from session
        req.session.reminders = req.session.reminders.filter(r => !dueReminders.includes(r));
      }

      // First, try to handle as command
      const commandResult = await commandHandler.handleCommand(message, req.session);
      
      if (commandResult.handled) {
        // Command was executed successfully
        const response = reminderNotification + commandResult.response;
        
        // Add assistant response to history
        req.session.conversationHistory.push({ role: 'assistant', content: response });
        
        return res.json({
          response: response,
          action: commandResult.action || null,
          commandExecuted: true
        });
      }
      
      // Not a command, use AI for intelligent conversation
      const aiResponse = await aiService.getAIResponse(
        message, 
        req.session.conversationHistory,
        reminderNotification
      );
      
      // Add AI response to history
      req.session.conversationHistory.push({ role: 'assistant', content: aiResponse });
      
      res.json({
        response: aiResponse,
        action: null,
        commandExecuted: false
      });
      
    } catch (error) {
      console.error('Chat controller error:', error);
      res.status(500).json({ 
        error: 'I encountered an error processing your request',
        response: "I'm having trouble processing that right now. Please try again."
      });
    }
  }

  async executeSystemCommand(req, res) {
    try {
      const { command } = req.body;
      const systemAutomation = require('../services/systemAutomation');
      const result = await systemAutomation.executeSystemCommand(command);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async clearSession(req, res) {
    if (req.session) {
      req.session.destroy();
      res.json({ message: 'Session cleared successfully' });
    } else {
      res.json({ message: 'No active session' });
    }
  }
}

module.exports = new ChatController();
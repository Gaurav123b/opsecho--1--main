import axios from 'axios';
import prisma from '../lib/prisma';

export const postToSlack = async (userId: string, incidentId: string, actionDescription: string) => {
  try {
    // 1. Get the user's Slack integration token
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'SLACK' } }
    });

    if (!integration || !integration.accessToken) {
      console.log('No Slack integration found for user');
      return false;
    }

    // 2. Fetch incident details for context
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { title: true, roomCode: true, severity: true }
    });

    // 3. Post message to Slack
    // For a hackathon demo, #general is standard. If the bot/user isn't in #general, 
    // it might fail, but for a fresh workspace demo it usually works.
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: '#general', 
        text: `🚨 *OpsEcho Action Confirmed*\n*Incident:* [${incident?.roomCode}] ${incident?.title}\n*Action:* ${actionDescription}\n*Status:* In Progress`,
        unfurl_links: false
      },
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Successfully posted action to Slack #general for incident ${incident?.roomCode}`);
    return true;
  } catch (error: any) {
    console.error('Failed to post to Slack:', error?.response?.data || error.message);
    return false;
  }
};

export const postResolutionToSlack = async (userId: string, incidentId: string, summary: string) => {
  try {
    // 1. Get the user's Slack integration token
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'SLACK' } }
    });

    if (!integration || !integration.accessToken) {
      console.log('No Slack integration found for user');
      return false;
    }

    // 2. Fetch incident details for context
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { title: true, roomCode: true, severity: true }
    });

    // 3. Post message to Slack
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: '#general', 
        text: `✅ *OpsEcho Incident Resolved*\n*Incident:* [${incident?.roomCode}] ${incident?.title}\n\n*Summary:*\n${summary}`,
        unfurl_links: false
      },
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Successfully posted resolution summary to Slack #general for incident ${incident?.roomCode}`);
    return true;
  } catch (error: any) {
    console.error('Failed to post resolution to Slack:', error?.response?.data || error.message);
    return false;
  }
};

/**
 * Google Chat Live Call Monitoring & Takeover Integration
 * For Retell AI Voice Agents
 *
 * Features:
 * - Sends alerts to Google Chat when call connects
 * - Displays customer/lead information
 * - Streams live transcription to chat
 * - Enables team members to request call takeover
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const router = express.Router();

// Google Chat Configuration
const GOOGLE_CHAT_WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK_URL;

// Store active calls with their Google Chat thread keys
const activeCalls = new Map();

// =============================================================================
// GOOGLE CHAT MESSAGE BUILDERS
// =============================================================================

/**
 * Build initial call alert card for Google Chat
 */
function buildCallAlertCard(callData) {
    const { call_id, customer, lead_info, agent_name, from_number, to_number } = callData;

    return {
        cardsV2: [{
            cardId: `call-${call_id}`,
            card: {
                header: {
                    title: "🔴 LIVE CALL IN PROGRESS",
                    subtitle: `Agent: ${agent_name || 'TravelBucks Concierge'}`,
                    imageUrl: "https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg",
                    imageType: "CIRCLE"
                },
                sections: [
                    {
                        header: "Customer Information",
                        widgets: [
                            {
                                decoratedText: {
                                    topLabel: "Name",
                                    text: customer?.name || lead_info?.name || "Unknown",
                                    startIcon: {
                                        knownIcon: "PERSON"
                                    }
                                }
                            },
                            {
                                decoratedText: {
                                    topLabel: "Phone",
                                    text: customer?.phone || from_number || "Unknown",
                                    startIcon: {
                                        knownIcon: "PHONE"
                                    }
                                }
                            },
                            {
                                decoratedText: {
                                    topLabel: "Email",
                                    text: customer?.email || lead_info?.email || "Not provided",
                                    startIcon: {
                                        knownIcon: "EMAIL"
                                    }
                                }
                            }
                        ]
                    },
                    {
                        header: "Lead Details",
                        collapsible: true,
                        widgets: [
                            {
                                textParagraph: {
                                    text: formatLeadInfo(lead_info)
                                }
                            }
                        ]
                    },
                    {
                        header: "Call Controls",
                        widgets: [
                            {
                                buttonList: {
                                    buttons: [
                                        {
                                            text: "🎧 Request Takeover",
                                            onClick: {
                                                action: {
                                                    function: "requestCallTakeover",
                                                    parameters: [
                                                        {
                                                            key: "call_id",
                                                            value: call_id
                                                        }
                                                    ]
                                                }
                                            },
                                            color: {
                                                red: 0.2,
                                                green: 0.7,
                                                blue: 1.0
                                            }
                                        },
                                        {
                                            text: "📝 View Full Details",
                                            onClick: {
                                                openLink: {
                                                    url: `${process.env.DASHBOARD_URL || 'https://app.retellai.com'}/call/${call_id}`
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        }]
    };
}

/**
 * Build transcript message for Google Chat
 */
function buildTranscriptMessage(speaker, text, timestamp) {
    const icon = speaker === 'agent' ? '🤖' : '👤';
    const speakerLabel = speaker === 'agent' ? 'Agent' : 'Customer';

    return {
        text: `**${icon} ${speakerLabel}** (${new Date(timestamp).toLocaleTimeString()}):\n${text}`
    };
}

/**
 * Build call ended summary card
 */
function buildCallEndedCard(callData) {
    const { call_id, duration, outcome, customer } = callData;

    return {
        cardsV2: [{
            cardId: `call-ended-${call_id}`,
            card: {
                header: {
                    title: "✅ Call Ended",
                    subtitle: `Duration: ${formatDuration(duration)}`,
                },
                sections: [
                    {
                        widgets: [
                            {
                                decoratedText: {
                                    topLabel: "Outcome",
                                    text: outcome || "Completed",
                                    startIcon: {
                                        knownIcon: "STAR"
                                    }
                                }
                            },
                            {
                                decoratedText: {
                                    topLabel: "Customer",
                                    text: customer?.name || "Unknown"
                                }
                            }
                        ]
                    }
                ]
            }
        }]
    };
}

/**
 * Format lead information for display
 */
function formatLeadInfo(lead_info) {
    if (!lead_info) return "No additional lead information available.";

    let formatted = "";
    if (lead_info.source) formatted += `**Source:** ${lead_info.source}\n`;
    if (lead_info.campaign) formatted += `**Campaign:** ${lead_info.campaign}\n`;
    if (lead_info.interests) formatted += `**Interests:** ${lead_info.interests}\n`;
    if (lead_info.notes) formatted += `**Notes:** ${lead_info.notes}\n`;

    return formatted || "No additional lead information available.";
}

/**
 * Format duration in seconds to readable format
 */
function formatDuration(seconds) {
    if (!seconds) return "0s";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

// =============================================================================
// GOOGLE CHAT API FUNCTIONS
// =============================================================================

/**
 * Send message to Google Chat space
 */
async function sendToGoogleChat(message, threadKey = null) {
    if (!GOOGLE_CHAT_WEBHOOK_URL) {
        console.warn('⚠️  Google Chat webhook URL not configured');
        return null;
    }

    try {
        const url = threadKey
            ? `${GOOGLE_CHAT_WEBHOOK_URL}&threadKey=${threadKey}`
            : GOOGLE_CHAT_WEBHOOK_URL;

        const response = await axios.post(url, message);

        return response.data;
    } catch (error) {
        console.error('❌ Error sending to Google Chat:', error.message);
        throw error;
    }
}

/**
 * Send call alert to Google Chat
 */
async function sendCallAlert(callData) {
    const card = buildCallAlertCard(callData);
    const threadKey = `call-${callData.call_id}`;

    const response = await sendToGoogleChat(card, threadKey);

    // Store thread info for later transcript updates
    activeCalls.set(callData.call_id, {
        threadKey,
        customer: callData.customer,
        startTime: new Date(),
        transcriptCount: 0
    });

    console.log(`✅ Call alert sent to Google Chat for call ${callData.call_id}`);

    return response;
}

/**
 * Send transcript update to Google Chat thread
 */
async function sendTranscriptUpdate(callId, speaker, text, timestamp) {
    const callInfo = activeCalls.get(callId);

    if (!callInfo) {
        console.warn(`⚠️  No active call found for ${callId}`);
        return;
    }

    const message = buildTranscriptMessage(speaker, text, timestamp);

    await sendToGoogleChat(message, callInfo.threadKey);

    // Update transcript count
    callInfo.transcriptCount++;
    activeCalls.set(callId, callInfo);

    console.log(`📝 Transcript update sent for call ${callId} (${speaker})`);
}

/**
 * Send call ended notification
 */
async function sendCallEnded(callData) {
    const callInfo = activeCalls.get(callData.call_id);

    if (!callInfo) {
        console.warn(`⚠️  No active call found for ${callData.call_id}`);
        return;
    }

    const endCard = buildCallEndedCard({
        ...callData,
        customer: callInfo.customer,
        duration: Math.floor((new Date() - callInfo.startTime) / 1000)
    });

    await sendToGoogleChat(endCard, callInfo.threadKey);

    // Clean up
    activeCalls.delete(callData.call_id);

    console.log(`✅ Call ended notification sent for call ${callData.call_id}`);
}

// =============================================================================
// RETELL WEBHOOK ENDPOINTS
// =============================================================================

/**
 * POST /webhook/retell/call-started
 * Called when a Retell call starts
 */
router.post('/webhook/retell/call-started', async (req, res) => {
    try {
        const { call_id, call, agent, metadata } = req.body;

        console.log(`🔔 Call started: ${call_id}`);

        // Extract customer/lead information
        const callData = {
            call_id: call_id || call?.call_id,
            customer: {
                name: metadata?.customer_name || null,
                phone: call?.from_number || metadata?.customer_phone || null,
                email: metadata?.customer_email || null
            },
            lead_info: {
                source: metadata?.lead_source || null,
                campaign: metadata?.campaign || null,
                interests: metadata?.interests || null,
                notes: metadata?.notes || null
            },
            agent_name: agent?.agent_name || metadata?.agent_name || 'TravelBucks Concierge',
            from_number: call?.from_number,
            to_number: call?.to_number
        };

        // Send alert to Google Chat
        await sendCallAlert(callData);

        res.json({ success: true, message: 'Call alert sent' });

    } catch (error) {
        console.error('❌ Error in call-started webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /webhook/retell/transcript-update
 * Called when transcript is updated during call
 */
router.post('/webhook/retell/transcript-update', async (req, res) => {
    try {
        const { call_id, transcript } = req.body;

        // Handle array of transcript updates
        const updates = Array.isArray(transcript) ? transcript : [transcript];

        for (const update of updates) {
            const { role, content, timestamp } = update;

            await sendTranscriptUpdate(
                call_id,
                role === 'agent' ? 'agent' : 'customer',
                content,
                timestamp || new Date().toISOString()
            );
        }

        res.json({ success: true, message: 'Transcript updates sent' });

    } catch (error) {
        console.error('❌ Error in transcript-update webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /webhook/retell/call-ended
 * Called when a Retell call ends
 */
router.post('/webhook/retell/call-ended', async (req, res) => {
    try {
        const { call_id, call_analysis, end_reason } = req.body;

        console.log(`📞 Call ended: ${call_id}`);

        const callData = {
            call_id,
            outcome: call_analysis?.outcome || end_reason || 'completed'
        };

        await sendCallEnded(callData);

        res.json({ success: true, message: 'Call ended notification sent' });

    } catch (error) {
        console.error('❌ Error in call-ended webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// GOOGLE CHAT INTERACTION ENDPOINTS
// =============================================================================

/**
 * POST /webhook/google-chat/interaction
 * Handles button clicks from Google Chat (call takeover, etc.)
 */
router.post('/webhook/google-chat/interaction', async (req, res) => {
    try {
        const { action, parameters, user } = req.body;

        if (action?.actionMethodName === 'requestCallTakeover') {
            const callId = parameters?.find(p => p.key === 'call_id')?.value;

            if (!callId) {
                return res.json({
                    text: "❌ Error: Call ID not found"
                });
            }

            const callInfo = activeCalls.get(callId);

            if (!callInfo) {
                return res.json({
                    text: "❌ Call has already ended or is not active"
                });
            }

            // Send takeover request notification
            const userName = user?.displayName || user?.name || 'Team Member';

            await sendToGoogleChat({
                text: `🎧 **${userName}** has requested to take over the call. Transfer initiated...`
            }, callInfo.threadKey);

            // TODO: Implement actual call transfer logic via Retell API
            // This would involve calling Retell's transfer endpoint

            return res.json({
                actionResponse: {
                    type: "UPDATE_MESSAGE",
                },
                text: `✅ Takeover requested by ${userName}. Transferring call...`
            });
        }

        res.json({ text: "Action received" });

    } catch (error) {
        console.error('❌ Error in Google Chat interaction:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

/**
 * GET /google-chat/active-calls
 * Get list of currently active calls
 */
router.get('/google-chat/active-calls', (req, res) => {
    const calls = Array.from(activeCalls.entries()).map(([callId, info]) => ({
        call_id: callId,
        thread_key: info.threadKey,
        customer: info.customer,
        start_time: info.startTime,
        transcript_count: info.transcriptCount,
        duration: Math.floor((new Date() - info.startTime) / 1000)
    }));

    res.json({
        active_call_count: calls.length,
        calls
    });
});

/**
 * POST /google-chat/test
 * Test Google Chat integration
 */
router.post('/google-chat/test', async (req, res) => {
    try {
        const testCard = buildCallAlertCard({
            call_id: 'test-' + Date.now(),
            customer: {
                name: 'John Test',
                phone: '+1234567890',
                email: 'test@example.com'
            },
            lead_info: {
                source: 'Test Campaign',
                campaign: 'Integration Test',
                interests: 'Travel packages',
                notes: 'This is a test alert'
            },
            agent_name: 'TravelBucks Concierge',
            from_number: '+1234567890',
            to_number: '+0987654321'
        });

        await sendToGoogleChat(testCard, 'test-thread');

        res.json({
            success: true,
            message: 'Test alert sent to Google Chat'
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
            message: 'Failed to send test alert'
        });
    }
});

module.exports = router;

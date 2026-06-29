from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
import json

ORCHESTRATOR_INSTRUCTION = """
You are the CivicPulse Orchestrator. When an issue_events message arrives:

STANDARD FLOW:
1. Publish to classifier_jobs with issue_id and media_urls
2. After classifier result: check confidence
   - confidence >= 0.85 → publish to router_jobs
   - confidence 0.60-0.85 → publish to router_jobs WITH needs_human_review flag
   - confidence < 0.60 → mark issue NEEDS_REVIEW, notify human moderator
3. Check risk_to_life flag:
   - If TRUE → SKIP standard flow → immediately escalate to level 2 (Ward Officer) → set SLA 24h
4. After router_jobs result → publish to notifications with ASSIGNED template

ALWAYS log every decision with agent name, timestamp, input summary, output summary, and confidence.
Return results as JSON only. No markdown, no preamble.
"""

def publish_to_classifier(issue_id: str, media_urls: list[str]):
    # Mock implementation
    pass

def publish_to_router(issue_id: str, classification_data: dict):
    # Mock implementation
    pass

def update_issue_status(issue_id: str, status: str):
    # Mock implementation
    pass

def log_agent_action(agent: str, action: str, details: str):
    # Mock implementation
    pass

def trigger_critical_escalation(issue_id: str):
    # Mock implementation
    pass

def create_orchestrator():
    return LlmAgent(
        name="civicpulse_orchestrator",
        model="gemini-2.0-flash-exp",
        instruction=ORCHESTRATOR_INSTRUCTION,
        tools=[
            FunctionTool(publish_to_classifier),
            FunctionTool(publish_to_router),
            FunctionTool(update_issue_status),
            FunctionTool(log_agent_action),
            FunctionTool(trigger_critical_escalation),
        ]
    )

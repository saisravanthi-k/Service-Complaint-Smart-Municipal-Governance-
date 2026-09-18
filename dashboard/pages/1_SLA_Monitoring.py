import streamlit as st
import plotly.graph_objects as go
import pandas as pd

st.set_page_config(page_title="SLA Compliance Monitoring", page_icon="⏱️", layout="wide")

st.title("⏱️ SLA Compliance & Breach Monitoring")
st.write("Real-time monitoring of department SLA deadlines, breach risks, and resolution speed.")

col1, col2 = st.columns([1, 1])

with col1:
    fig_gauge = go.Figure(go.Indicator(
        mode = "gauge+number+delta",
        value = 91.5,
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "Citywide SLA Compliance Rate (%)"},
        delta = {'reference': 90.0, 'increasing': {'color': "green"}},
        gauge = {
            'axis': {'range': [None, 100]},
            'bar': {'color': "#2563EB"},
            'steps': [
                {'range': [0, 75], 'color': "#FEE2E2"},
                {'range': [75, 90], 'color': "#FEF3C7"},
                {'range': [90, 100], 'color': "#D1FAE5"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 95.0
            }
        }
    ))
    st.plotly_chart(fig_gauge, use_container_width=True)

with col2:
    dept_df = pd.DataFrame([
        {"Department": "Water Supply & Sanitation", "Total": 142, "Resolved in SLA": 138, "Breached": 4, "Compliance Rate": 97.1},
        {"Department": "Roads & Infrastructure", "Total": 198, "Resolved in SLA": 172, "Breached": 26, "Compliance Rate": 86.8},
        {"Department": "Electricity & Power Grid", "Total": 112, "Resolved in SLA": 109, "Breached": 3, "Compliance Rate": 97.3},
        {"Department": "Public Health & Waste", "Total": 115, "Resolved in SLA": 108, "Breached": 7, "Compliance Rate": 93.9},
        {"Department": "Town Planning", "Total": 87, "Resolved in SLA": 78, "Breached": 9, "Compliance Rate": 89.6}
    ])
    st.subheader("Department-wise SLA Breakdown")
    st.dataframe(dept_df, use_container_width=True, hide_index=True)

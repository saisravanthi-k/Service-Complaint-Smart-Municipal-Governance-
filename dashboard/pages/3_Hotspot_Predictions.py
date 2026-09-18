import streamlit as st
import plotly.express as px
import pandas as pd
from utils import fetch_hotspot_predictions

st.set_page_config(page_title="Hotspot Predictions", page_icon="🔮", layout="wide")

st.title("🔮 AI Complaint Hotspot Predictions")
st.write("Predicting upcoming municipal complaint surges using spatial-temporal ML models (Random Forest + ARIMA).")

df = fetch_hotspot_predictions()

st.subheader("High Risk Ward Heatmap")
fig = px.bar(df, x="ward_name", y="predicted_complaints", color="risk_score",
             labels={"predicted_complaints": "Predicted Issues Next 14 Days", "risk_score": "Risk Index"},
             color_continuous_scale="Reds",
             title="Predicted Complaint Density per Ward")
st.plotly_chart(fig, use_container_width=True)

st.subheader("Detailed Predictive Risk Assessment")
st.dataframe(df, use_container_width=True, hide_index=True)

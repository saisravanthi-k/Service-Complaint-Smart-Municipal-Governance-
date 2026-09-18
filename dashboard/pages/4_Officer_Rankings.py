import streamlit as st
import pandas as pd
from utils import fetch_rankings

st.set_page_config(page_title="Officer Rankings", page_icon="🏆", layout="wide")

st.title("🏆 Municipal Officer & Department Rankings")
st.write("Performance scorecards based on resolution speed, citizen feedback ratings, and SLA compliance.")

df = fetch_rankings()

col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Officer Leaderboard")
    st.dataframe(df, use_container_width=True, hide_index=True)

with col2:
    st.subheader("Ranking Methodology")
    st.markdown("""
    - **Resolution Speed (40%)**: Avg hours to resolve ticket vs SLA.
    - **CSAT Rating (40%)**: Citizen star ratings and resolution verification.
    - **Workload Efficiency (20%)**: Volume of complex tickets managed without SLA breach.
    """)

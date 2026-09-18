import streamlit as st
import plotly.express as px
import pandas as pd
from utils import fetch_ward_analytics

st.set_page_config(page_title="Ward-wise Analytics", page_icon="🗺️", layout="wide")

st.title("🗺️ Ward-wise Geospatial Analytics")
st.write("Demographic population density, open issues, and civic vulnerability index per ward.")

df_wards = fetch_ward_analytics()

col1, col2 = st.columns([2, 1])

with col1:
    fig_map = px.scatter_mapbox(
        df_wards,
        lat="latitude",
        lon="longitude",
        size="total_issues",
        color="vulnerability_index",
        hover_name="ward_name",
        hover_data=["ward_id", "population", "open_issues"],
        color_continuous_scale=px.colors.cyclical.IceFire,
        size_max=35,
        zoom=10.5,
        mapbox_style="carto-positron",
        title="Interactive Geospatial Ward Map (Size: Total Issues, Color: Vulnerability Index)"
    )
    fig_map.update_layout(margin={"r":0,"t":40,"l":0,"b":0})
    st.plotly_chart(fig_map, use_container_width=True)

with col2:
    st.subheader("Ward Summary Matrix")
    st.dataframe(df_wards[["ward_id", "ward_name", "population", "open_issues", "vulnerability_index"]], use_container_width=True, hide_index=True)

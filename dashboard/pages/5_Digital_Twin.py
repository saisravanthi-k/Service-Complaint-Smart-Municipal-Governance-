import streamlit as st
import plotly.graph_objects as go
import numpy as np

st.set_page_config(page_title="Digital Twin Ward", page_icon="🏙️", layout="wide")

st.title("🏙️ Digital Twin Ward Simulator")
st.write("2D/3D Cyber-Physical Simulation of Municipal Infrastructure, Pipeline Health, and Live Ticket Vectors.")

selected_ward = st.selectbox("Select Ward for Digital Twin Rendering", ["WARD-01: Charminar East", "WARD-04: Secunderabad Central", "WARD-05: Kukatpally Industrial"])

# Generate 3D grid layout representing municipal assets
np.random.seed(42)
x = np.random.uniform(0, 100, 40)
y = np.random.uniform(0, 100, 40)
z = np.random.uniform(5, 50, 40)
status = np.random.choice(["HEALTHY", "MAINTENANCE_REQUIRED", "CRITICAL_ALERT"], 40, p=[0.7, 0.2, 0.1])
color_map = {"HEALTHY": "#10B981", "MAINTENANCE_REQUIRED": "#F59E0B", "CRITICAL_ALERT": "#EF4444"}
colors = [color_map[s] for s in status]

fig3d = go.Figure(data=[go.Scatter3d(
    x=x, y=y, z=z,
    mode='markers+text',
    marker=dict(
        size=10,
        color=colors,
        opacity=0.8
    ),
    text=[f"Asset-{i}" for i in range(1, 41)]
)])

fig3d.update_layout(
    title=f"3D Municipal Infrastructure Asset Mesh - {selected_ward}",
    scene=dict(
        xaxis_title="East-West Grid (m)",
        yaxis_title="North-South Grid (m)",
        zaxis_title="Elevation / Pipeline Depth (m)"
    ),
    margin=dict(l=0, r=0, b=0, t=40)
)

st.plotly_chart(fig3d, use_container_width=True)

col1, col2, col3 = st.columns(3)
col1.metric("Simulated Asset Health", "94.2%", "Operational")
col2.metric("Telemetry Pipeline Pressure", "4.2 bar", "Normal Range")
col3.metric("Live Active Incident Sensors", "3 Active", "-2 from yesterday")
